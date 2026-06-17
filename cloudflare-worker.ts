type Market = "A股" | "港股" | "美股" | "宏观";

type HotEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  importance: string;
  impact: string;
  risks: string[];
  uncertainty: string;
  category: string;
  markets: Market[];
  score: number;
  confidence: number;
  status: "published" | "review";
  publishedAt: string;
  assets: Array<{ symbol: string; name: string; market: string; relation: string }>;
  sources: Array<{ id: string; sourceName: string; sourceType: string; title: string; url: string; publishedAt: string }>;
};

const events: HotEvent[] = [
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
    assets: [{ symbol: "HSTECH", name: "恒生科技指数", market: "港股", relation: "平台经济" }],
    sources: [{ id: "s6", sourceName: "港交所披露易", sourceType: "交易所", title: "公司自愿公告", url: "https://www.hkexnews.hk/", publishedAt: "2026-06-15T05:50:00-07:00" }]
  }
];

const publishedEvents = events.filter((event) => event.status === "published");

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  }).format(new Date(value));
}

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · 财讯雷达</title>
  <style>
    :root{--navy:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#b45309;--bg:#f8fafc;--green:#15803d}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
    a{color:inherit;text-decoration:none}.shell{max-width:1120px;margin:0 auto;padding:0 20px}
    header{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:1}.nav{height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    .brand{font-weight:800;letter-spacing:.08em}.brand b{color:var(--accent)}nav{display:flex;gap:18px;font-size:14px;color:#374151}
    .hero{padding:64px 0 36px;display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:end}.hero h1{font-size:48px;line-height:1.08;margin:10px 0;font-family:Georgia,"Songti SC",serif}.hero p{color:#4b5563;line-height:1.8}
    .badge{display:inline-block;background:#fff7ed;color:var(--accent);border:1px solid #fed7aa;padding:6px 10px;font-size:12px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stat,.card,.panel{background:#fff;border:1px solid var(--line);box-shadow:0 12px 35px rgba(15,23,42,.04)}
    .stat{padding:18px}.stat span{display:block;color:var(--muted);font-size:12px}.stat b{font-size:28px}
    .grid{display:grid;grid-template-columns:2fr 1fr;gap:22px;margin:24px 0}.section-title{display:flex;justify-content:space-between;align-items:center;margin:24px 0 14px}.section-title h2{margin:0;font-size:24px;font-family:Georgia,"Songti SC",serif}.section-title a{font-size:13px;color:var(--accent)}
    .card{display:block;padding:22px;margin-bottom:14px}.meta{display:flex;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:12px}.tag{background:#f3f4f6;padding:4px 8px}.card h3{font-size:22px;line-height:1.35;margin:12px 0}.card p{color:#4b5563;line-height:1.75}.score{color:var(--accent);font-weight:800}
    .panel{padding:22px}.panel ul{padding-left:18px;color:#4b5563;line-height:1.8}.search{display:flex;gap:8px}.search input{flex:1;padding:12px;border:1px solid var(--line)}.search button{padding:12px 16px;background:var(--navy);color:#fff;border:0}
    .detail{background:#fff;border:1px solid var(--line);padding:28px;margin:26px 0}.detail h1{font-family:Georgia,"Songti SC",serif;font-size:40px}.detail section{border-top:1px solid var(--line);padding-top:18px;margin-top:18px}.source{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--line);color:#4b5563}
    .api{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#111827;color:#e5e7eb;padding:14px;overflow:auto}
    footer{border-top:1px solid var(--line);color:var(--muted);font-size:12px;padding:28px 0 44px;margin-top:40px;line-height:1.7}
    @media(max-width:760px){.hero,.grid{grid-template-columns:1fr}.hero h1{font-size:36px}.nav{height:auto;padding:14px 0;align-items:flex-start;flex-direction:column}nav{overflow:auto;width:100%;white-space:nowrap}.stats{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header><div class="shell nav"><a class="brand" href="/">财讯<b>雷达</b></a><nav><a href="/">首页</a><a href="/all">全部热点</a><a href="/daily">今日日报</a><a href="/search">搜索</a><a href="/sources">信源</a><a href="/about">关于</a></nav></div></header>
  <main class="shell">${body}</main>
  <footer class="shell">财讯雷达目前为公开信源聚合与演示版本。所有内容仅供信息参考，不构成投资建议；请以交易所、监管机构、公司公告等原文为准。</footer>
</body>
</html>`;
}

function eventCard(event: HotEvent) {
  return `<a class="card" href="/events/${event.slug}">
    <div class="meta"><span class="tag">${escapeHtml(event.category)}</span><span>${event.markets.map(escapeHtml).join(" / ")}</span><span>${formatDate(event.publishedAt)}</span><span class="score">热度 ${event.score}</span></div>
    <h3>${escapeHtml(event.title)}</h3>
    <p>${escapeHtml(event.summary)}</p>
    <div class="meta"><span>${event.sources.length} 个信源</span><span>置信度 ${Math.round(event.confidence * 100)}%</span></div>
  </a>`;
}

function home() {
  const top = publishedEvents.slice(0, 3).map(eventCard).join("");
  return page("首页", `<section class="hero">
    <div><span class="badge">公开信源 · 中文聚合 · 风险提示</span><h1>把财经热点先筛出来，再告诉你为什么重要。</h1><p>财讯雷达聚合央行、交易所、监管机构和公司公告等公开信息，用中文摘要、影响路径和风险提示帮助你快速判断重点。</p></div>
    <div class="stats"><div class="stat"><span>已发布热点</span><b>${publishedEvents.length}</b></div><div class="stat"><span>覆盖市场</span><b>4</b></div><div class="stat"><span>公开信源</span><b>${events.reduce((sum, event) => sum + event.sources.length, 0)}</b></div></div>
  </section><div class="grid"><section><div class="section-title"><h2>今日热点</h2><a href="/all">查看全部 →</a></div>${top}</section><aside class="panel"><h2>快速搜索</h2><form class="search" action="/search"><input name="q" placeholder="输入央行、半导体、消费等关键词"><button>搜索</button></form><h2>当前口径</h2><ul><li>优先展示已发布热点</li><li>保留信源数量和置信度</li><li>不替代投资研究和公告原文</li></ul></aside></div>`);
}

function allEvents() {
  return page("全部热点", `<section class="hero"><div><span class="badge">ALL EVENTS</span><h1>全部财经热点</h1><p>按热度和发布时间展示，方便快速扫一遍今天值得关注的变化。</p></div></section>${events.map(eventCard).join("")}`);
}

function daily() {
  const groups = new Map<string, HotEvent[]>();
  for (const event of publishedEvents) {
    const key = event.category;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  const sections = [...groups].map(([category, items]) => `<section><div class="section-title"><h2>${escapeHtml(category)}</h2><span>${items.length} 篇</span></div>${items.map(eventCard).join("")}</section>`).join("");
  return page("今日日报", `<section class="hero"><div><span class="badge">DAILY BRIEF</span><h1>今日财经日报</h1><p>把公开信源里的重点事件按主题整理，先看结论，再看影响和风险。</p></div></section>${sections}`);
}

function detail(slug: string) {
  const event = events.find((item) => item.slug === slug);
  if (!event) return page("未找到", `<section class="hero"><div><h1>没有找到这条热点</h1><p>可以回到 <a href="/all">全部热点</a> 继续查看。</p></div></section>`);
  return page(event.title, `<article class="detail"><a href="/all">← 返回全部热点</a><h1>${escapeHtml(event.title)}</h1><div class="meta"><span class="tag">${escapeHtml(event.category)}</span><span>${event.markets.map(escapeHtml).join(" / ")}</span><span>热度 ${event.score}</span><span>置信度 ${Math.round(event.confidence * 100)}%</span></div><p>${escapeHtml(event.summary)}</p><section><h2>为什么重要</h2><p>${escapeHtml(event.importance)}</p></section><section><h2>可能影响</h2><p>${escapeHtml(event.impact)}</p></section><section><h2>风险提示</h2><ul>${event.risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul><p>${escapeHtml(event.uncertainty)}</p></section><section><h2>相关资产</h2>${event.assets.map((asset) => `<p><b>${escapeHtml(asset.symbol)}</b> ${escapeHtml(asset.name)} · ${escapeHtml(asset.market)} · ${escapeHtml(asset.relation)}</p>`).join("")}</section><section><h2>公开信源</h2>${event.sources.map((source) => `<a class="source" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><span><b>${escapeHtml(source.sourceName)}</b><br>${escapeHtml(source.title)}</span><small>${escapeHtml(source.sourceType)}</small></a>`).join("")}</section></article>`);
}

function search(url: URL) {
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const results = query ? events.filter((event) => [event.title, event.summary, event.category, event.markets.join(" "), event.assets.map((asset) => asset.name).join(" ")].join(" ").toLowerCase().includes(query)) : [];
  return page("搜索", `<section class="hero"><div><span class="badge">SEARCH</span><h1>搜索热点</h1><p>输入关键词，查找标题、摘要、市场和相关资产。</p></div></section><form class="search" action="/search"><input name="q" value="${escapeHtml(query)}" placeholder="例如：央行、半导体、消费"><button>搜索</button></form><div class="section-title"><h2>${query ? `搜索结果：${escapeHtml(query)}` : "请输入关键词"}</h2><span>${results.length} 条</span></div>${results.map(eventCard).join("")}`);
}

function simplePage(title: string, content: string) {
  return page(title, `<section class="hero"><div><span class="badge">${escapeHtml(title)}</span><h1>${escapeHtml(title)}</h1><p>${content}</p></div></section>`);
}

function json(data: unknown) {
  return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
}

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/events") return json(events);
    if (path.startsWith("/api/events/")) {
      const event = events.find((item) => item.slug === decodeURIComponent(path.slice("/api/events/".length)));
      return event ? json(event) : json({ error: "not_found" });
    }
    if (path === "/") return html(home());
    if (path === "/all") return html(allEvents());
    if (path === "/daily") return html(daily());
    if (path === "/search") return html(search(url));
    if (path === "/about") return html(simplePage("关于财讯雷达", "这是一个面向中文用户的财经热点聚合网站，当前版本先聚合公开信源、给出中文摘要、影响判断和风险提示。"));
    if (path === "/sources") return html(simplePage("信源说明", "优先参考央行、交易所、监管机构、公司公告和公开市场资料。平台会保留来源链接，方便你继续核对原文。"));
    if (path === "/feedback") return html(simplePage("反馈入口", "如果发现信息不准确、来源失效或需要新增栏目，可以先记录问题，后续接入表单和后台审核流程。"));
    if (path.startsWith("/events/")) return html(detail(decodeURIComponent(path.slice("/events/".length))));

    return html(simplePage("页面不存在", "这个地址暂时没有内容，可以回到首页继续浏览。"), 404);
  }
};
