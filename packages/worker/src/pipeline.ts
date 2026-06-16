import { normalizeUrl, shouldAutoPublish, type AIProvider, type HotEvent, type SourceAdapter, type SourceStory } from "@finance-radar/domain";
import { createHash } from "node:crypto";
import { ChineseLocalizer } from "./localization.js";

const GENERIC_TITLE_TERMS = new Set([
  "公告",
  "发布",
  "公司",
  "市场",
  "财经",
  "最新",
  "动态",
  "申请",
  "表格",
  "申报",
  "报告",
  "更新",
  "关于",
  "表示",
  "认为",
]);

const MARKET_ANCHOR_TERMS = [
  "沪指",
  "上证",
  "上证指数",
  "深证",
  "创业板",
  "恒生",
  "恒指",
  "道指",
  "纳指",
  "标普",
  "费城半导体",
  "黄金",
  "金价",
  "白银",
  "原油",
  "布伦特",
  "WTI",
  "A股",
  "港股",
  "美股",
].map((term) => term.toLowerCase());

function canonicalTitleTerm(term: string) {
  const normalized = term.toLowerCase();
  if (normalized.includes("上证")) return "上证";
  if (normalized.includes("沪指")) return "沪指";
  if (normalized.includes("纳指")) return "纳指";
  if (normalized.includes("道指")) return "道指";
  if (normalized.includes("标普")) return "标普";
  if (normalized.includes("恒生") || normalized.includes("恒指")) return "恒生";
  if (normalized.includes("原油") || normalized.includes("wti") || normalized.includes("布伦特")) return "原油";
  if (normalized.includes("黄金") || normalized.includes("金价")) return "黄金";
  if (normalized.includes("白银")) return "白银";
  return normalized;
}

function tokenizeTitle(title: string) {
  const compact = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.%]+/gu, " ")
    .trim();
  const terms = new Set<string>();
  for (const match of compact.match(/\d+(?:\.\d+)?%?/g) ?? []) {
    terms.add(match);
  }
  for (const anchor of MARKET_ANCHOR_TERMS) {
    if (compact.includes(anchor.toLowerCase())) terms.add(canonicalTitleTerm(anchor));
  }
  for (const part of compact.split(/\s+/).filter(Boolean)) {
    if (/^[a-z0-9.%-]{2,}$/i.test(part)) terms.add(canonicalTitleTerm(part));
    const chineseParts = part.match(/\p{Script=Han}+/gu) ?? [];
    for (const chinese of chineseParts) {
      if (chinese.length <= 4) {
        if (!GENERIC_TITLE_TERMS.has(chinese)) terms.add(canonicalTitleTerm(chinese));
        continue;
      }
      for (let size = 2; size <= 4; size += 1) {
        for (let index = 0; index <= chinese.length - size; index += 1) {
          const term = canonicalTitleTerm(chinese.slice(index, index + size));
          if (!GENERIC_TITLE_TERMS.has(term)) terms.add(term);
        }
      }
    }
  }
  return [...terms]
    .filter((term) => term.length >= 2 && !GENERIC_TITLE_TERMS.has(term))
    .sort((a, b) => {
      const scoreA = /\d/.test(a) ? 4 : MARKET_ANCHOR_TERMS.includes(a) ? 3 : a.length >= 3 ? 1 : 0;
      const scoreB = /\d/.test(b) ? 4 : MARKET_ANCHOR_TERMS.includes(b) ? 3 : b.length >= 3 ? 1 : 0;
      return scoreB - scoreA || a.localeCompare(b);
    })
    .slice(0, 10)
    .sort();
}

export function clusterKeyFromStory(story: SourceStory) {
  const terms = tokenizeTitle(story.title);
  if (terms.length === 0) return normalizeUrl(story.url);
  return terms.slice(0, 6).join("|");
}

function hasStrongTitleOverlap(left: SourceStory, right: SourceStory) {
  const leftTerms = new Set(tokenizeTitle(left.title));
  const rightTerms = new Set(tokenizeTitle(right.title));
  if (leftTerms.size === 0 || rightTerms.size === 0) return false;
  const shared = [...leftTerms].filter((term) => rightTerms.has(term));
  const hasMarketAnchor = shared.some((term) => MARKET_ANCHOR_TERMS.includes(term) || /\d/.test(term));
  return shared.length >= 4 || (hasMarketAnchor && shared.length >= 3);
}

function eventKey(stories: SourceStory[]) {
  const firstDate = stories
    .map((story) => story.publishedAt)
    .sort()[0]
    ?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${firstDate}|${stories.map(clusterKeyFromStory).sort().join("|")}`)
    .digest("hex")
    .slice(0, 20);
}

export function deduplicateStories(stories: SourceStory[]) {
  const seen = new Set<string>();
  return stories.filter((story) => {
    const key = `${normalizeUrl(story.url)}|${story.title.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function clusterStories(stories: SourceStory[]) {
  const groups: SourceStory[][] = [];
  for (const story of stories) {
    const group = groups.find((candidate) => candidate.some((member) => hasStrongTitleOverlap(member, story)));
    if (group) {
      group.push(story);
    } else {
      groups.push([story]);
    }
  }
  return groups;
}

export async function processSources(adapters: SourceAdapter[], ai: AIProvider, since: Date): Promise<HotEvent[]> {
  const settled = await Promise.allSettled(adapters.map((adapter) => adapter.fetch(since)));
  const rawStories = deduplicateStories(settled.flatMap((result) => result.status === "fulfilled" ? result.value : []));
  const stories = await new ChineseLocalizer().localizeStories(rawStories);
  const events: HotEvent[] = [];
  for (const group of clusterStories(stories)) {
    const analysis = await ai.analyze(group);
    const key = eventKey(group);
    const draft: HotEvent = {
      id: key,
      slug: `event-${key}`,
      title: group[0]?.title ?? "未命名事件",
      category: "待分类",
      markets: ["宏观"],
      score: Math.round(analysis.confidence * 100),
      status: "review",
      publishedAt: new Date().toISOString(),
      sources: group,
      assets: [],
      ...analysis,
    };
    draft.status = shouldAutoPublish(draft) ? "published" : "review";
    events.push(draft);
  }
  return events;
}
