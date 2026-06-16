export default function AboutPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">ABOUT</span>
        <h1>关于财讯雷达</h1>
        <p>财讯雷达把公开财经信源整理成中文热点、影响说明和风险提示，帮助普通投资者减少噪声。</p>
      </div>
      <section className="info-grid">
        <article className="info-card"><h2>我们做什么</h2><p>聚合公开信源，去重、聚类、中文化，再按影响程度展示热点。</p></article>
        <article className="info-card"><h2>我们不做什么</h2><p>不提供买卖建议、目标价、自动交易，也不承诺收益。</p></article>
        <article className="info-card"><h2>数据口径</h2><p>行情来自公开接口参考，可能延迟；正式投资判断请以交易所和公司公告原文为准。</p></article>
      </section>
    </main>
  );
}
