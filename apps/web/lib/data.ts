import type { HotEvent, Market } from "@finance-radar/domain";

export const events: HotEvent[] = [
  {
    id: "evt-001",
    slug: "global-central-banks-rate-path",
    title: "全球央行利率路径出现分化，风险资产重新定价",
    summary: "最新政策表态显示，主要经济体降息节奏可能继续分化。市场开始重新评估美元、成长股和高股息资产的相对吸引力。",
    importance: "利率是全球资产定价的锚。路径变化会同时影响股票估值、汇率和跨境资金流向。",
    impact: "短期可能提高市场波动率；高估值成长板块对利率预期更敏感，银行与高股息资产可能受益于利差和防御需求。",
    risks: ["政策表态不等同于最终行动", "通胀与就业数据可能迅速改变预期"],
    uncertainty: "不同央行后续行动仍取决于未来数据，目前无法确认分化会持续多久。",
    category: "宏观政策",
    markets: ["A股", "港股", "美股", "宏观"],
    score: 94,
    confidence: 0.91,
    status: "published",
    publishedAt: "2026-06-15T08:20:00-07:00",
    assets: [
      { symbol: "DXY", name: "美元指数", market: "宏观", relation: "利率预期" },
      { symbol: "HSI", name: "恒生指数", market: "港股", relation: "跨境流动性" },
      { symbol: "SPX", name: "标普500", market: "美股", relation: "估值敏感" }
    ],
    sources: [
      { id: "s1", sourceName: "美联储", sourceType: "央行官网", title: "政策会议声明", url: "https://www.federalreserve.gov/", publishedAt: "2026-06-15T06:10:00-07:00" },
      { id: "s2", sourceName: "中国人民银行", sourceType: "央行官网", title: "公开市场业务公告", url: "https://www.pbc.gov.cn/", publishedAt: "2026-06-15T04:30:00-07:00" },
      { id: "s3", sourceName: "香港金融管理局", sourceType: "监管机构", title: "市场及政策动态", url: "https://www.hkma.gov.hk/", publishedAt: "2026-06-15T03:40:00-07:00" }
    ]
  },
  {
    id: "evt-002",
    slug: "semiconductor-capex-cycle",
    title: "半导体资本开支预期升温，产业链关注度上升",
    summary: "多家公司公告和产业链信息指向先进制程、存储及设备投资保持活跃，但不同环节景气度仍明显分化。",
    importance: "资本开支决定产业链订单能见度，也是判断半导体周期持续性的核心指标。",
    impact: "设备、材料和先进封装可能获得更多关注；高预期板块若订单不及预期，回撤风险也更高。",
    risks: ["产业链信息可能存在重复统计", "出口限制与终端需求仍有扰动"],
    uncertainty: "目前尚不能确认投资强度会全面传导至所有细分领域。",
    category: "产业趋势",
    markets: ["A股", "港股", "美股"],
    score: 88,
    confidence: 0.87,
    status: "published",
    publishedAt: "2026-06-15T07:35:00-07:00",
    assets: [
      { symbol: "SOX", name: "费城半导体指数", market: "美股", relation: "行业景气" },
      { symbol: "688981", name: "中芯国际", market: "A股", relation: "先进制程" }
    ],
    sources: [
      { id: "s4", sourceName: "上交所公告", sourceType: "交易所", title: "半导体公司公告汇总", url: "https://www.sse.com.cn/", publishedAt: "2026-06-15T05:20:00-07:00" },
      { id: "s5", sourceName: "公司 IR", sourceType: "公司公告", title: "资本开支更新", url: "https://www.sec.gov/edgar.shtml", publishedAt: "2026-06-15T05:05:00-07:00" }
    ]
  },
  {
    id: "evt-003",
    slug: "consumer-platform-results",
    title: "平台消费数据改善，但盈利修复仍需验证",
    summary: "多项经营数据反映线上消费活跃度回升，市场关注收入增长能否进一步转化为利润改善。",
    importance: "消费平台连接居民需求与企业经营，是观察消费修复的重要窗口。",
    impact: "交易情绪可能改善，但后续仍需关注补贴强度、获客成本和利润率。",
    risks: ["短期促销可能放大数据表现", "单月数据不能代表趋势"],
    uncertainty: "盈利修复速度仍缺少足够连续数据支持。",
    category: "公司动态",
    markets: ["港股", "美股"],
    score: 79,
    confidence: 0.76,
    status: "review",
    publishedAt: "2026-06-15T06:15:00-07:00",
    assets: [
      { symbol: "HSTECH", name: "恒生科技指数", market: "港股", relation: "平台经济" }
    ],
    sources: [
      { id: "s6", sourceName: "港交所披露易", sourceType: "交易所", title: "公司自愿公告", url: "https://www.hkexnews.hk/", publishedAt: "2026-06-15T05:50:00-07:00" }
    ]
  }
];

export const publishedEvents = events.filter((event) => event.status === "published");
export const categories = ["全部", "宏观政策", "产业趋势", "公司动态", "监管公告"];
export const markets: Array<Market | "全部"> = ["全部", "A股", "港股", "美股", "宏观"];

export function findEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}
