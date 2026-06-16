import { createHash } from "node:crypto";
import type { AIProvider, HotEvent, SourceAdapter, SourceStory } from "@finance-radar/domain";
import { XMLParser } from "fast-xml-parser";

type FeedRecord = Record<string, unknown>;

function arrayOf<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (value && typeof value === "object") {
    const record = value as FeedRecord;
    return textOf(record["#text"] ?? record.text ?? record.title ?? "");
  }
  return "";
}

function linkOf(value: unknown): string {
  if (typeof value === "string") return value;
  for (const candidate of arrayOf(value as FeedRecord | FeedRecord[] | undefined)) {
    if (typeof candidate === "string") return candidate;
    const href = textOf(candidate?.["@_href"]);
    const rel = textOf(candidate?.["@_rel"]);
    if (href && (!rel || rel === "alternate")) return href;
  }
  return "";
}

function stableId(sourceId: string, url: string, title: string) {
  return createHash("sha256").update(`${sourceId}|${url}|${title}`).digest("hex").slice(0, 24);
}

export interface RssAtomFeedOptions {
  id: string;
  sourceName: string;
  sourceType: string;
  feedUrl: string;
  userAgent?: string;
  maxItems?: number;
  includeTitlePattern?: string;
  excludeTitlePattern?: string;
}

export class RssAtomFeedAdapter implements SourceAdapter {
  readonly id: string;

  constructor(private readonly options: RssAtomFeedOptions) {
    this.id = options.id;
  }

  async fetch(since: Date): Promise<SourceStory[]> {
    const response = await fetch(this.options.feedUrl, {
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
        "user-agent": this.options.userAgent ?? "FinanceRadar/0.1 public-feed-aggregator",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`${this.id} feed failed: ${response.status}`);
    const xml = await response.text();
    const parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true }).parse(xml) as FeedRecord;
    const rssChannel = (parsed.rss as FeedRecord | undefined)?.channel as FeedRecord | undefined;
    const atomFeed = parsed.feed as FeedRecord | undefined;
    const records = rssChannel ? arrayOf(rssChannel.item as FeedRecord | FeedRecord[] | undefined) : arrayOf(atomFeed?.entry as FeedRecord | FeedRecord[] | undefined);

    const includePattern = this.options.includeTitlePattern ? new RegExp(this.options.includeTitlePattern, "i") : undefined;
    const excludePattern = this.options.excludeTitlePattern ? new RegExp(this.options.excludeTitlePattern, "i") : undefined;
    return records
      .slice(0, this.options.maxItems ?? 100)
      .map((record) => {
        const title = textOf(record.title);
        const url = linkOf(record.link) || textOf(record.guid) || textOf(record.id);
        const publishedAt = textOf(record.pubDate ?? record.published ?? record.updated ?? record.date);
        const date = new Date(publishedAt);
        if (!title || !url || Number.isNaN(date.getTime())) return undefined;
        return {
          id: stableId(this.id, url, title),
          sourceName: this.options.sourceName,
          sourceType: this.options.sourceType,
          title,
          url,
          publishedAt: date.toISOString(),
        } satisfies SourceStory;
      })
      .filter((story): story is SourceStory => story !== undefined)
      .filter((story) => (!includePattern || includePattern.test(story.title)) && (!excludePattern || !excludePattern.test(story.title)))
      .filter((story) => new Date(story.publishedAt) >= since);
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  async analyze(stories: SourceStory[]) {
    const baseUrl = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!baseUrl || !apiKey) return new RuleBasedAIProvider().analyze(stories);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "只依据提供的公开信源输出JSON。必须区分事实、影响推断、风险与不确定性。禁止给出买卖建议、目标价或收益承诺。" },
          { role: "user", content: JSON.stringify(stories) },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`AI provider failed: ${response.status}`);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as Partial<HotEvent>;
    return {
      summary: parsed.summary ?? "摘要生成失败，需人工复核。",
      importance: parsed.importance ?? "需人工复核。",
      impact: parsed.impact ?? "暂无可靠影响判断。",
      risks: parsed.risks ?? ["AI 输出需人工复核"],
      uncertainty: parsed.uncertainty ?? "当前信息不足。",
      confidence: parsed.confidence ?? 0.4,
    };
  }
}

export class RuleBasedAIProvider implements AIProvider {
  async analyze(stories: SourceStory[]) {
    const title = stories[0]?.title ?? "待分析事件";
    const distinctSources = new Set(stories.map((story) => story.sourceName)).size;
    return {
      summary: `${title}。当前共聚合 ${stories.length} 个公开信源，详细事实需以原文为准。`,
      importance: "该事件可能影响市场预期，需结合后续公告与数据验证。",
      impact: "目前只能确认信息层面的影响，资产价格方向不确定。",
      risks: ["信源数量有限", "后续信息可能改变当前判断"],
      uncertainty: "缺少连续数据和进一步官方确认。",
      confidence: distinctSources >= 2 ? 0.83 : 0.58,
    };
  }
}
