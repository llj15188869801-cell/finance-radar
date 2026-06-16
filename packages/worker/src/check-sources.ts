import { createOfficialSourceAdapters } from "./sources.js";

const hours = Number(process.env.SOURCE_CHECK_HOURS ?? 24 * 7);
const since = new Date(Date.now() - hours * 60 * 60_000);
const results = await Promise.allSettled(createOfficialSourceAdapters().map(async (adapter) => {
  const stories = await adapter.fetch(since);
  return {
    id: adapter.id,
    status: "ok",
    count: stories.length,
    latest: stories[0]?.publishedAt ?? null,
    sample: stories.slice(0, 2).map((story) => story.title),
  };
}));

const report = results.map((result) => result.status === "fulfilled"
  ? result.value
  : { status: "failed", error: result.reason instanceof Error ? result.reason.message : String(result.reason) });

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), lookbackHours: hours, sources: report }, null, 2));
if (results.every((result) => result.status === "rejected")) process.exitCode = 1;
