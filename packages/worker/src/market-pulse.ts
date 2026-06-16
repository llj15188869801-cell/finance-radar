import { createHash } from "node:crypto";
import type { AssetReference, HotEvent, Market, SourceStory } from "@finance-radar/domain";

const tencentIndexUrl = process.env.MARKET_INDEX_ENDPOINT ?? "https://qt.gtimg.cn/q=s_sh000001,s_sz399001,s_sz399006,s_hkHSI,usDJI,usIXIC,usINX";
const tencentCommodityUrl = process.env.MARKET_COMMODITY_ENDPOINT ?? "https://qt.gtimg.cn/q=hf_CL,hf_GC,hf_SI,hf_OIL,hf_XAU";
const eastmoneySectorUrl = process.env.MARKET_SECTOR_ENDPOINT ?? "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f12,f14,f2,f3";

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  updatedAt: string;
}

export interface SectorQuote {
  name: string;
  changePercent: number;
}

function numberOf(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseTencentIndexes(body: string): MarketQuote[] {
  return body.split(/;\s*/).flatMap((line) => {
    const match = line.match(/^v_(\w+)="(.+)"$/);
    if (!match) return [];
    const [, symbol = "", raw = ""] = match;
    const fields = raw.split("~");
    const isUS = symbol.startsWith("us");
    const updatedAt = isUS ? fields[30] : new Date().toISOString();
    return [{
      symbol,
      name: fields[1] ?? symbol,
      price: numberOf(fields[3]),
      changePercent: numberOf(isUS ? fields[32] : fields[5]),
      updatedAt: updatedAt || new Date().toISOString(),
    }];
  });
}

export function parseTencentCommodities(body: string): MarketQuote[] {
  return body.split(/;\s*/).flatMap((line) => {
    const match = line.match(/^v_(\w+)="(.+)"$/);
    if (!match) return [];
    const [, symbol = "", raw = ""] = match;
    const fields = raw.split(",");
    return [{
      symbol,
      name: fields[13] ?? symbol,
      price: numberOf(fields[0]),
      changePercent: numberOf(fields[1]),
      updatedAt: `${fields[12] ?? ""}T${fields[6] ?? "00:00:00"}`,
    }];
  });
}

export function parseEastmoneySectors(body: string): SectorQuote[] {
  const parsed = JSON.parse(body) as { data?: { diff?: Array<{ f14?: string; f3?: number }> } };
  return (parsed.data?.diff ?? []).flatMap((item) =>
    item.f14 && Number.isFinite(item.f3) ? [{ name: item.f14, changePercent: Number(item.f3) }] : [],
  );
}

function source(id: string, title: string, url: string, publishedAt: string): SourceStory {
  return { id, sourceName: "公开行情参考", sourceType: "公开行情数据（可能延迟）", title, url, publishedAt };
}

function asset(symbol: string, name: string, market: Market, relation: string): AssetReference {
  return { symbol, name, market, relation };
}

function pulse(input: {
  key: string; title: string; summary: string; category: string; markets: Market[]; score: number;
  publishedAt: string; assets: AssetReference[]; sources: SourceStory[]; importance: string; impact: string; risks: string[];
}): HotEvent {
  const id = createHash("sha256").update(input.key).digest("hex").slice(0, 20);
  return {
    id,
    slug: `market-pulse-${input.key}`,
    title: input.title,
    summary: input.summary,
    importance: input.importance,
    impact: input.impact,
    risks: [...input.risks, "公开行情可能存在延迟，请以交易所最终数据为准"],
    uncertainty: "市场价格会持续变化，当前内容仅反映抓取时点，不构成投资建议。",
    category: input.category,
    markets: input.markets,
    score: input.score,
    confidence: 0.88,
    status: "published",
    publishedAt: input.publishedAt,
    assets: input.assets,
    sources: input.sources,
  };
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function direction(value: number) {
  return value >= 0 ? "上涨" : "下跌";
}

function groupDirection(values: number[]) {
  if (values.every((value) => value > 0)) return "集体上涨";
  if (values.every((value) => value < 0)) return "集体下跌";
  return "涨跌不一";
}

function pairDirection(values: number[]) {
  if (values.every((value) => value > 0)) return "同步上涨";
  if (values.every((value) => value < 0)) return "同步下跌";
  return "走势分化";
}

export function buildMarketPulseEvents(indexes: MarketQuote[], commodities: MarketQuote[], sectors: SectorQuote[], now = new Date()): HotEvent[] {
  const date = now.toISOString().slice(0, 10);
  const bySymbol = new Map([...indexes, ...commodities].map((quote) => [quote.symbol, quote]));
  const sh = bySymbol.get("s_sh000001");
  const sz = bySymbol.get("s_sz399001");
  const cyb = bySymbol.get("s_sz399006");
  const hsi = bySymbol.get("s_hkHSI");
  const dji = bySymbol.get("usDJI");
  const ixic = bySymbol.get("usIXIC");
  const inx = bySymbol.get("usINX");
  const oil = bySymbol.get("hf_CL");
  const brent = bySymbol.get("hf_OIL");
  const gold = bySymbol.get("hf_GC");
  const silver = bySymbol.get("hf_SI");
  const topSectors = sectors.slice(0, 3);
  const events: HotEvent[] = [];

  if (sh && sz && cyb) {
    const sectorText = topSectors.map((item) => `${item.name}${signedPercent(item.changePercent)}`).join("、");
    events.push(pulse({
      key: `${date}-a-share-close`,
      title: `A股主要指数${groupDirection([sh.changePercent, sz.changePercent, cyb.changePercent])}，${topSectors[0]?.name ?? "强势板块"}领涨`,
      summary: `截至公开行情抓取时，上证指数报${sh.price.toFixed(2)}点（${signedPercent(sh.changePercent)}），深证成指${signedPercent(sz.changePercent)}，创业板指${signedPercent(cyb.changePercent)}。领涨方向包括${sectorText || "暂无板块数据"}。`,
      importance: "主要指数与领涨板块能直接反映A股风险偏好和资金交易主线。",
      impact: "需要结合成交额、北向资金和后续消息面验证行情持续性，不能只凭单次抓取判断趋势。",
      risks: ["板块涨幅可能在盘中快速变化", "单日表现不代表中长期趋势"],
      category: "A股行情", markets: ["A股"], score: 96, publishedAt: sh.updatedAt,
      assets: [asset("000001.SH", "上证指数", "A股", signedPercent(sh.changePercent)), asset("399006.SZ", "创业板指", "A股", signedPercent(cyb.changePercent))],
      sources: [source(`quote-a-${date}`, "A股指数与板块公开行情", tencentIndexUrl, sh.updatedAt), source(`sector-a-${date}`, "A股领涨板块公开行情", eastmoneySectorUrl, sh.updatedAt)],
    }));
  }

  if (dji && ixic && inx) {
    events.push(pulse({
      key: `${date}-us-market-close`,
      title: `美股三大指数${groupDirection([dji.changePercent, ixic.changePercent, inx.changePercent])}，纳指${signedPercent(ixic.changePercent)}`,
      summary: `截至公开行情抓取时，道琼斯指数${signedPercent(dji.changePercent)}，纳斯达克指数${signedPercent(ixic.changePercent)}，标普500指数${signedPercent(inx.changePercent)}。`,
      importance: "美股主要指数是全球风险偏好与科技股交易情绪的重要风向标。",
      impact: "后续需结合美债收益率、美元指数和科技股权重表现，判断其对亚洲市场的传导强度。",
      risks: ["美股盘后与下一交易日走势可能反转"],
      category: "美股行情", markets: ["美股"], score: 94, publishedAt: dji.updatedAt,
      assets: [asset(".DJI", "道琼斯指数", "美股", signedPercent(dji.changePercent)), asset(".IXIC", "纳斯达克指数", "美股", signedPercent(ixic.changePercent)), asset(".INX", "标普500指数", "美股", signedPercent(inx.changePercent))],
      sources: [source(`quote-us-${date}`, "美股主要指数公开行情", tencentIndexUrl, dji.updatedAt)],
    }));
  }

  if (oil && brent) {
    events.push(pulse({
      key: `${date}-crude-oil`,
      title: `国际油价${pairDirection([oil.changePercent, brent.changePercent])}，WTI报${oil.price.toFixed(2)}美元`,
      summary: `截至公开行情抓取时，WTI原油${signedPercent(oil.changePercent)}，报${oil.price.toFixed(2)}美元/桶；布伦特原油${signedPercent(brent.changePercent)}，报${brent.price.toFixed(2)}美元/桶。`,
      importance: "油价变化会影响全球通胀预期、能源股表现以及航空和化工行业成本。",
      impact: "对能源股和下游成本的影响需要结合库存、汇率和地缘消息继续验证。",
      risks: ["地缘事件可能令油价快速反转"],
      category: "大宗商品", markets: ["宏观", "美股"], score: 92, publishedAt: oil.updatedAt,
      assets: [asset("CL", "WTI原油", "宏观", signedPercent(oil.changePercent)), asset("BZ", "布伦特原油", "宏观", signedPercent(brent.changePercent))],
      sources: [source(`quote-oil-${date}`, "国际原油公开行情", tencentCommodityUrl, oil.updatedAt)],
    }));
  }

  if (gold && silver) {
    events.push(pulse({
      key: `${date}-precious-metals`,
      title: `贵金属${pairDirection([gold.changePercent, silver.changePercent])}，白银波动${Math.abs(silver.changePercent) >= Math.abs(gold.changePercent) ? "更强" : "收窄"}`,
      summary: `截至公开行情抓取时，纽约黄金${signedPercent(gold.changePercent)}，报${gold.price.toFixed(2)}美元/盎司；纽约白银${signedPercent(silver.changePercent)}，报${silver.price.toFixed(2)}美元/盎司。`,
      importance: "金银价格是观察避险情绪、美元走势和实际利率预期的重要窗口。",
      impact: "贵金属对相关股票和商品基金的影响，需要结合美元、实际利率和风险偏好变化继续验证。",
      risks: ["贵金属高位波动风险较大"],
      category: "大宗商品", markets: ["宏观"], score: 88, publishedAt: gold.updatedAt,
      assets: [asset("GC", "纽约黄金", "宏观", signedPercent(gold.changePercent)), asset("SI", "纽约白银", "宏观", signedPercent(silver.changePercent))],
      sources: [source(`quote-metals-${date}`, "贵金属公开行情", tencentCommodityUrl, gold.updatedAt)],
    }));
  }

  if (hsi) {
    events.push(pulse({
      key: `${date}-hong-kong-market`,
      title: `恒生指数${direction(hsi.changePercent)}${Math.abs(hsi.changePercent).toFixed(2)}%，报${hsi.price.toFixed(2)}点`,
      summary: `恒生指数最新报${hsi.price.toFixed(2)}点，涨跌幅${signedPercent(hsi.changePercent)}。`,
      importance: "恒生指数反映港股整体风险偏好，也是观察跨境资金情绪的重要指标。",
      impact: "港股指数变化可能影响互联网、金融和高股息板块交易情绪。",
      risks: ["港股受海外市场与汇率影响较大"],
      category: "港股行情", markets: ["港股"], score: 84, publishedAt: hsi.updatedAt,
      assets: [asset("HSI", "恒生指数", "港股", signedPercent(hsi.changePercent))],
      sources: [source(`quote-hk-${date}`, "港股指数公开行情", tencentIndexUrl, hsi.updatedAt)],
    }));
  }
  return events;
}

export async function fetchMarketPulseEvents() {
  const [indexResult, commodityResult, sectorResult] = await Promise.allSettled([
    fetch(tencentIndexUrl, { signal: AbortSignal.timeout(15_000) }),
    fetch(tencentCommodityUrl, { signal: AbortSignal.timeout(15_000) }),
    fetch(eastmoneySectorUrl, { signal: AbortSignal.timeout(15_000) }),
  ]);
  const indexResponse = indexResult.status === "fulfilled" && indexResult.value.ok ? indexResult.value : undefined;
  const commodityResponse = commodityResult.status === "fulfilled" && commodityResult.value.ok ? commodityResult.value : undefined;
  const sectorResponse = sectorResult.status === "fulfilled" && sectorResult.value.ok ? sectorResult.value : undefined;
  if (!indexResponse && !commodityResponse) throw new Error("公开行情指数和商品数据源均失败");
  return buildMarketPulseEvents(
    indexResponse ? parseTencentIndexes(await indexResponse.text()) : [],
    commodityResponse ? parseTencentCommodities(await commodityResponse.text()) : [],
    sectorResponse ? parseEastmoneySectors(await sectorResponse.text()) : [],
  );
}
