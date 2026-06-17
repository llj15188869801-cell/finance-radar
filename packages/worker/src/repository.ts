import { PrismaClient } from "@prisma/client";
import { normalizeUrl, type HotEvent } from "@finance-radar/domain";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/finance_radar",
});

type DbEventStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "WITHDRAWN";

function dbStatus(status: HotEvent["status"]): DbEventStatus {
  const statuses: Record<HotEvent["status"], DbEventStatus> = {
    draft: "DRAFT",
    review: "REVIEW",
    published: "PUBLISHED",
    withdrawn: "WITHDRAWN",
  };
  return statuses[status];
}

export async function persistEvents(events: HotEvent[]) {
  for (const event of events) {
    await prisma.$transaction(async (tx) => {
      const savedEvent = await tx.hotEvent.upsert({
        where: { slug: event.slug },
        update: {
          title: event.title,
          summary: event.summary,
          importance: event.importance,
          impact: event.impact,
          risks: event.risks,
          uncertainty: event.uncertainty,
          category: event.category,
          markets: event.markets,
          score: event.score,
          confidence: event.confidence,
          status: dbStatus(event.status),
          publishedAt: event.status === "published" ? new Date(event.publishedAt) : null,
        },
        create: {
          slug: event.slug,
          title: event.title,
          summary: event.summary,
          importance: event.importance,
          impact: event.impact,
          risks: event.risks,
          uncertainty: event.uncertainty,
          category: event.category,
          markets: event.markets,
          score: event.score,
          confidence: event.confidence,
          status: dbStatus(event.status),
          publishedAt: event.status === "published" ? new Date(event.publishedAt) : null,
        },
      });

      const currentArticleIds: string[] = [];
      for (const story of event.sources) {
        const source = await tx.source.upsert({
          where: { adapterKey: story.sourceName },
          update: { name: story.sourceName, type: story.sourceType },
          create: { name: story.sourceName, type: story.sourceType, adapterKey: story.sourceName, url: new URL(story.url).origin },
        });
        const article = await tx.rawArticle.upsert({
          where: { canonicalUrl: normalizeUrl(story.url) },
          update: { sourceId: source.id, title: story.title, publishedAt: new Date(story.publishedAt) },
          create: { sourceId: source.id, canonicalUrl: normalizeUrl(story.url), title: story.title, publishedAt: new Date(story.publishedAt) },
        });
        currentArticleIds.push(article.id);
        await tx.eventSource.upsert({
          where: { eventId_articleId: { eventId: savedEvent.id, articleId: article.id } },
          update: {},
          create: { eventId: savedEvent.id, articleId: article.id },
        });
      }
      await tx.eventSource.deleteMany({
        where: { eventId: savedEvent.id, articleId: { notIn: currentArticleIds } },
      });
      await tx.assetReference.deleteMany({ where: { eventId: savedEvent.id } });
      if (event.assets.length > 0) {
        await tx.assetReference.createMany({
          data: event.assets.map((asset) => ({ eventId: savedEvent.id, ...asset })),
        });
      }
    }, { timeout: 20_000 });
  }
  const reconciled = await reconcilePublishedEvents();
  return { persisted: events.length, reconciled };
}

export async function reconcilePublishedEvents() {
  const published = await prisma.hotEvent.findMany({
    where: { status: "PUBLISHED" },
    include: { sources: { include: { article: { include: { source: true } } } } },
  });
  const invalid = published.filter((event) => {
    const sourceTypes = event.sources.map((link) => link.article.source.type);
    if (sourceTypes.some((type) => type.includes("公开行情数据"))) return false;
    return new Set(event.sources.map((link) => link.article.source.name)).size < 2;
  });
  if (invalid.length > 0) {
    await prisma.hotEvent.updateMany({
      where: { id: { in: invalid.map((event) => event.id) } },
      data: { status: "REVIEW", publishedAt: null },
    });
  }
  return { downgraded: invalid.length };
}

export async function closeRepository() {
  await prisma.$disconnect();
}
