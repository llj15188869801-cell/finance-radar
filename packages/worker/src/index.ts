import { Queue, Worker } from "bullmq";
import { OpenAICompatibleProvider } from "./adapters.js";
import { processSources } from "./pipeline.js";
import { closeRepository, persistEvents } from "./repository.js";
import { createOfficialSourceAdapters } from "./sources.js";
import { syncMirror } from "./sync.js";
import { fetchMarketPulseEvents } from "./market-pulse.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
{
  const url = new URL(redisUrl);
  const connection = {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
  const queue = new Queue("finance-radar", { connection });
  await queue.upsertJobScheduler("quarter-hourly-pipeline", { every: 15 * 60_000 }, { name: "run-pipeline" });

  const adapters = createOfficialSourceAdapters();
  const ai = new OpenAICompatibleProvider();
  let pipelineRunning = false;

  const worker = new Worker("finance-radar", async (job) => {
    if (job.name !== "run-pipeline") return;
    if (pipelineRunning) return { skipped: true, reason: "pipeline already running" };
    pipelineRunning = true;
    try {
    const [officialEvents, marketEvents] = await Promise.all([
      processSources(adapters, ai, new Date(Date.now() - 30 * 60_000)),
      fetchMarketPulseEvents().catch((error) => {
        console.error("市场脉冲抓取失败，本批继续处理官方信源", error);
        return [];
      }),
    ]);
    const events = [...marketEvents, ...officialEvents];
    await persistEvents(events);
    const mirror = await syncMirror({ type: "event-batch", events, generatedAt: new Date().toISOString() }).catch((error) => ({
      failed: true,
      error: error instanceof Error ? error.message : "unknown mirror sync error",
    }));
    return { processed: events.length, mirror };
    } finally {
      pipelineRunning = false;
    }
  }, { connection, concurrency: 1 });

  worker.on("completed", (job, result) => {
    console.info(`定时更新完成：${job.id}，结果 ${JSON.stringify(result)}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`定时更新失败：${job?.id ?? "unknown"}，${error.message}`);
  });

  let shuttingDown = false;
  async function shutdown(signal: NodeJS.Signals) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`收到 ${signal}，正在关闭财讯雷达 Worker...`);
    await worker.close();
    await queue.close();
    await closeRepository();
    console.info("财讯雷达 Worker 已安全退出。");
    process.exit(0);
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  console.info("财讯雷达 Worker 已启动，每 15 分钟运行一次。");
}
