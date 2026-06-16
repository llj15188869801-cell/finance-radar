import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const queue = new Queue("finance-radar", {
  connection: {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
  },
});

try {
  const [counts, schedulers, completed, failed] = await Promise.all([
    queue.getJobCounts("waiting", "active", "delayed", "failed", "completed", "paused"),
    queue.getJobSchedulers(0, 20, false),
    queue.getCompleted(0, 5),
    queue.getFailed(0, 5),
  ]);

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    counts,
    schedulers: schedulers.map((scheduler) => ({
      key: scheduler.key,
      name: scheduler.name,
      everyMs: scheduler.every,
      nextRunAt: typeof scheduler.next === "number" ? new Date(scheduler.next).toISOString() : null,
      iterationCount: scheduler.iterationCount,
    })),
    recentCompleted: completed.map((job) => ({
      id: job.id,
      name: job.name,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      returnvalue: job.returnvalue,
    })),
    recentFailed: failed.map((job) => ({
      id: job.id,
      name: job.name,
      failedReason: job.failedReason,
    })),
  }, null, 2));
} finally {
  await queue.close();
}
