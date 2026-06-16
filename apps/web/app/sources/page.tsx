export default function SourcesPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">SOURCE INTAKE</span>
        <h1>信源提报</h1>
        <p>只接收公开、稳定、可引用的财经信源。暂不抓取付费墙正文，不接入无授权转载源。</p>
      </div>
      <section className="info-grid">
        <article className="info-card"><h2>优先接入</h2><p>监管机构、交易所公告、央行与统计机构、上市公司 IR、公开 RSS、官方新闻稿。</p></article>
        <article className="info-card"><h2>暂不接入</h2><p>付费研报全文、闭源行情接口、个人微信群截图、无法核验来源的二手爆料。</p></article>
        <article className="info-card"><h2>提报格式</h2><p>请准备信源名称、公开网址、更新频率、覆盖市场、是否 RSS/API、你认为它重要的原因。</p></article>
      </section>
      <div className="admin-panel">
        <h2>提交方式</h2>
        <p className="lead">当前版本先通过反馈页人工收集，后台审核后再加入自动抓取候选池。</p>
        <a className="button-link" href="/feedback">去反馈页提交线索</a>
      </div>
    </main>
  );
}
