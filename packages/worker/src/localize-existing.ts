import { PrismaClient } from "@prisma/client";
import { ChineseLocalizer, needsTranslation } from "./localization.js";

const prisma = new PrismaClient();
const localizer = new ChineseLocalizer();

try {
  const events = await prisma.hotEvent.findMany({ orderBy: { createdAt: "asc" } });
  const targets = events.filter((event) => needsTranslation(event.title));
  let updated = 0;
  for (let index = 0; index < targets.length; index += 20) {
    const batch = targets.slice(index, index + 20);
    const translated = await localizer.translateTitles(batch.map((event) => event.title));
    await prisma.$transaction(batch.map((event, batchIndex) => prisma.hotEvent.update({
      where: { id: event.id },
      data: {
        title: translated[batchIndex]!,
        summary: `${translated[batchIndex]}。当前信息来自公开官方信源，详细事实请查看原文。`,
      },
    })));
    updated += batch.length;
    console.log(`已中文化 ${updated}/${targets.length} 条热点`);
  }

  const articles = await prisma.rawArticle.findMany();
  const articleTargets = articles.filter((article) => needsTranslation(article.title));
  for (let index = 0; index < articleTargets.length; index += 20) {
    const batch = articleTargets.slice(index, index + 20);
    const translated = await localizer.translateTitles(batch.map((article) => article.title));
    await prisma.$transaction(batch.map((article, batchIndex) => prisma.rawArticle.update({
      where: { id: article.id },
      data: { title: translated[batchIndex]! },
    })));
  }
  console.log(JSON.stringify({ success: true, eventsUpdated: targets.length, articlesUpdated: articleTargets.length }));
} finally {
  await prisma.$disconnect();
}
