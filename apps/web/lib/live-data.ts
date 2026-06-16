// EventStatus removed - using string literals
import type { HotEvent, Market } from "@finance-radar/domain";
import { events as demoEvents } from "./data";
import { prisma } from "./db";

function statusOf(status: EventStatus): HotEvent["status"] {
  return { DRAFT: "draft", REVIEW: "review", PUBLISHED: "published", WITHDRAWN: "withdrawn" }[status] as HotEvent["status"];
}

function marketArray(value: unknown): Market[] {
  return Array.isArray(value) ? value.filter((item): item is Market => ["A股", "港股", "美股", "宏观"].includes(String(item))) : ["宏观"];
}

function riskArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : ["需进一步核验"];
}

function ensureChinese(value: string, fallback: string) {
  const containsChinese = /[\u3400-\u9fff]/.test(value);
  const containsEnglishSentence = /[a-z]{4,}(?:\s+[a-z]{3,}){2,}/.test(value);
  const containsEnglishPhrase = /[A-Za-z]{3,}\s+(?:in|on|for|of|to|with|and|the|is|are)\s+[A-Za-z]{3,}/.test(value);
  if (containsChinese && !containsEnglishSentence && !containsEnglishPhrase && !/\bwith Q&A\b/i.test(value)) return value;
  return `${fallback}（原文正在中文化）`;
}

function cleanEditorialTitle(title: string) {
  return title
    .replace(/^海外财经动态[：:]\s*/, "")
    .replace(/^公开信源摘要[：:]\s*/, "")
    .replace(/Christine Lagarde/g, "克里斯蒂娜·拉加德")
    .replace(/Boris Vujčić/g, "鲍里斯·武伊契奇")
    .replace(/Frank Elderson/g, "弗兰克·埃尔德森")
    .trim();
}

function editorialCategory(title: string, sourceTypes: string[]) {
  if (/摩根士丹利|高盛|摩根大通|瑞银|花旗|美国银行/.test(title)) return "机构观点";
  if (/货币政策|利率|通胀|央行|准备金/.test(title)) return "宏观政策";
  if (/规则|监管|数据标准|压力测试|金融稳定/.test(title)) return "金融监管";
  if (/统计|指标|调查|数据/.test(title)) return "经济数据";
  if (/讲话|采访|声明|问答|拉加德/.test(title)) return "政策观察";
  if (sourceTypes.some((type) => type.includes("央行"))) return "央行动态";
  return "公司动态";
}

function editorialScore(title: string, sourceTypes: string[]) {
  let score = sourceTypes.some((type) => type.includes("央行")) ? 68 : 45;
  if (/货币政策|利率|降息|加息|通胀|就业/.test(title)) score += 20;
  if (/最终规则|监管|数据标准|压力测试|金融稳定/.test(title)) score += 16;
  if (/决定|声明|问答/.test(title)) score += 8;
  if (/采访|讲话|演讲/.test(title)) score += 3;
  if (/摩根士丹利|高盛|摩根大通|瑞银|花旗|美国银行/.test(title) && /A股|港股|美股|黄金|原油|市场/.test(title)) score += 34;
  if (/碳排放|结构性金融指标/.test(title)) score -= 8;
  if (/除了制定利率的决定外|非货币政策/.test(title)) score -= 30;
  return Math.min(score, 98);
}

function editorialSummary(title: string, sourceName: string, original: string) {
  if (/摩根士丹利|高盛|摩根大通|瑞银|花旗|美国银行/.test(title)) return `${sourceName}收录的机构市场观点。该内容属于观点与判断，不等同于已发生事实，也不构成投资建议。`;
  if (/货币政策决定/.test(title)) return `${sourceName}公布最新货币政策决定，市场重点关注利率路径、政策措辞以及对流动性预期的影响。`;
  if (/货币政策声明|含问答/.test(title)) return `${sourceName}发布货币政策声明并回应市场关切，后续需关注政策立场是否发生变化。`;
  if (/最终规则|数据标准/.test(title)) return `${sourceName}发布新的监管规则，可能影响金融机构的数据报送、合规成本和监管透明度。`;
  if (/压力测试/.test(title)) return `${sourceName}更新银行压力测试安排，结果将影响市场对银行资本充足率和风险承受能力的判断。`;
  if (/采访|讲话|演讲|拉加德/.test(title)) return `${sourceName}最新公开表态，值得关注其对通胀、利率和经济前景的政策信号。`;
  return cleanEditorialTitle(original);
}

function toHotEvent(record: Awaited<ReturnType<typeof queryEvents>>[number]): HotEvent {
  const sourceTypes = record.sources.map(({ article }) => article.source.type);
  const isMarketPulse = sourceTypes.some((type) => type.includes("公开行情数据"));
  const sourceName = record.sources[0]?.article.source.name ?? "官方机构";
  const title = cleanEditorialTitle(ensureChinese(record.title, "海外财经动态"));
  return {
    id: record.id,
    slug: record.slug,
    title,
    summary: isMarketPulse ? ensureChinese(record.summary, "行情摘要") : editorialSummary(title, sourceName, ensureChinese(record.summary, "公开信源摘要")),
    importance: ensureChinese(record.importance, "重要性说明"),
    impact: ensureChinese(record.impact, "可能影响"),
    risks: riskArray(record.risks),
    uncertainty: record.uncertainty,
    category: isMarketPulse ? record.category : editorialCategory(title, sourceTypes),
    markets: marketArray(record.markets),
    score: isMarketPulse ? record.score : editorialScore(title, sourceTypes),
    confidence: record.confidence,
    status: statusOf(record.status),
    publishedAt: (record.publishedAt ?? record.updatedAt).toISOString(),
    assets: record.assets.map((asset) => ({ symbol: asset.symbol, name: asset.name, market: asset.market as Market, relation: asset.relation })),
    sources: record.sources.map(({ article }) => ({
      id: article.id,
      sourceName: article.source.name,
      sourceType: article.source.type,
      title: ensureChinese(article.title, "原始信源"),
      url: article.canonicalUrl,
      publishedAt: article.publishedAt.toISOString(),
    })),
  };
}

function isUsefulForPublicFeed(event: HotEvent) {
  if (event.sources.some((source) => source.sourceName.includes("SEC"))) return false;
  if (/表格申报|SEC|CIK|申报方|发行人|报告方|原文正在中文化/.test(event.title)) return false;
  if (/^(Form|Schedule)\s|424B|10-D|497|N-CEN|POS EX/i.test(event.title)) return false;
  return event.score >= 72;
}

function queryEvents(limit = 100) {
  if (!prisma) throw new Error("Prisma not initialized"); 
  return prisma.hotEvent.findMany({
    where: { status: "PUBLISHED" },
    include: {
      assets: true,
      sources: { include: { article: { include: { source: true } } } },
    },
    orderBy: [{ updatedAt: "desc" }, { score: "desc" }],
    take: limit,
  });
}

export async function getLiveEvents(limit = 100): Promise<HotEvent[]> {
  try {
    const officialEvents = (await queryEvents(Math.max(limit * 3, 100)))
      .map(toHotEvent)
      .filter(isUsefulForPublicFeed)
    return officialEvents
      .sort((a, b) => b.score - a.score || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, limit);
  } catch (error) {
    console.error("Database unavailable, falling back to demo content", error);
    // Database unavailable in production without DATABASE_URL; fall back to demo data
    return demoEvents;
  }
}

export async function getFeaturedEvents(limit = 20) {
  const live = await getLiveEvents(100);
  const published = live.filter((event) => event.status === "published");
  return (published.length > 0 ? published : live.filter((event) => event.confidence >= 0.58)).slice(0, limit);
}

export async function getLiveEvent(slug: string) {
  return (await getLiveEvents(200)).find((event) => event.slug === slug);
}
