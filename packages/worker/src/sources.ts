import { RssAtomFeedAdapter, type RssAtomFeedOptions } from "./adapters.js";

export const officialFeedSources: RssAtomFeedOptions[] = [
  {
    id: "fed-all",
    sourceName: "美联储",
    sourceType: "央行官方 RSS",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
  },
  {
    id: "fed-monetary",
    sourceName: "美联储：货币政策",
    sourceType: "央行官方 RSS",
    feedUrl: "https://www.federalreserve.gov/feeds/press_monetary.xml",
  },
  {
    id: "ecb-news",
    sourceName: "欧洲央行",
    sourceType: "央行官方 RSS",
    feedUrl: "https://www.ecb.europa.eu/rss/press.html",
  },
  {
    id: "ecb-statistics",
    sourceName: "欧洲央行：统计发布",
    sourceType: "央行官方 RSS",
    feedUrl: "https://www.ecb.europa.eu/rss/statpress.html",
  },
  {
    id: "market-institution-views",
    sourceName: "机构观点公开新闻",
    sourceType: "公开新闻聚合 RSS",
    feedUrl: "https://news.google.com/rss/search?q=%28%E6%91%A9%E6%A0%B9%E5%A3%AB%E4%B8%B9%E5%88%A9+OR+%E9%AB%98%E7%9B%9B+OR+%E6%91%A9%E6%A0%B9%E5%A4%A7%E9%80%9A+OR+%E7%91%9E%E9%93%B6%29+%28A%E8%82%A1+OR+%E6%B8%AF%E8%82%A1+OR+%E7%BE%8E%E8%82%A1+OR+%E9%BB%84%E9%87%91+OR+%E5%8E%9F%E6%B2%B9%29+when%3A1d&hl=zh-CN&gl=CN&ceid=CN%3Azh-Hans",
    maxItems: 20,
  },
  {
    id: "sec-current",
    sourceName: "美国 SEC EDGAR",
    sourceType: "监管机构官方 Atom",
    feedUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&output=atom",
    userAgent: process.env.SEC_USER_AGENT ?? "FinanceRadar admin@example.com",
    maxItems: 100,
    includeTitlePattern: "^(8-K|10-K|10-Q|6-K|20-F)\\b",
    excludeTitlePattern: "^(424B2|424B3|FWP|D/A|D |10-D|25-NSE|UPLOAD|CORRESP|EFFECT|CERT|ABS-15G|497|497K|144|4|3|S-6|N-CEN|485|POS EX)\\b",
  },
];

export function createOfficialSourceAdapters() {
  return officialFeedSources.map((source) => new RssAtomFeedAdapter(source));
}
