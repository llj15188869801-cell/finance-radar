// string removed - using string literals
import { hotEventSchema, normalizeUrl, type HotEvent } from "@finance-radar/domain";
import { prisma } from "./db";

function dbStatus(status: HotEvent["status"]): string {
  return {
    draft: "DRAFT",
    review: "REVIEW",
    published: "PUBLISHED",
    withdrawn: "WITHDRAWN",
  }[status];
}

export async function persistSyncedEvents(payload: unknown) {
  const record = payload as { events?: unknown[] };
  const events = hotEventSchema.array().parse(record.events ?? []);
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
    });
  }
  return { persisted: events.length };
}

export async function getAdminSnapshot() {
  const [review, publishedCount, sourceCount, totalEvents] = await Promise.all([
    prisma.hotEvent.findMany({
      where: { status: "REVIEW" },
      include: { sources: { include: { article: { include: { source: true } } } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 50,
    }),
    prisma.hotEvent.count({ where: { status: "PUBLISHED" } }),
    prisma.source.count({ where: { enabled: true } }),
    prisma.hotEvent.count(),
  ]);
  return {
    review: review.map((event) => ({
      id: event.id,
      title: event.title,
      confidence: event.confidence,
      sourceCount: event.sources.length,
      updatedAt: event.updatedAt.toISOString(),
    })),
    stats: { reviewCount: review.length, publishedCount, sourceCount, totalEvents },
  };
}
