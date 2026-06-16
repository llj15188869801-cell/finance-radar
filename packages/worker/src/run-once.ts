import { OpenAICompatibleProvider } from "./adapters.js";
import { processSources } from "./pipeline.js";
import { closeRepository, persistEvents } from "./repository.js";
import { createOfficialSourceAdapters } from "./sources.js";
import { syncMirror } from "./sync.js";
import { fetchMarketPulseEvents } from "./market-pulse.js";

const minutes = Number(process.env.PIPELINE_LOOKBACK_MINUTES ?? 30);

try {
  const [officialEvents, marketEvents] = await Promise.all([
    processSources(createOfficialSourceAdapters(), new OpenAICompatibleProvider(), new Date(Date.now() - minutes * 60_000)),
    fetchMarketPulseEvents().catch((error) => {
      console.error("市场脉冲抓取失败，本批继续处理官方信源", error);
      return [];
    }),
  ]);
  const events = [...marketEvents, ...officialEvents];
  const persistence = await persistEvents(events);
  const mirror = await syncMirror({ type: "event-batch", events, generatedAt: new Date().toISOString() }).catch((error) => ({
    failed: true,
    error: error instanceof Error ? error.message : "unknown mirror sync error",
  }));
  console.log(JSON.stringify({ success: true, lookbackMinutes: minutes, events: events.length, persistence, mirror }, null, 2));
} finally {
  await closeRepository();
}
