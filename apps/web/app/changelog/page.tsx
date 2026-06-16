export default function ChangelogPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">CHANGELOG</span>
        <h1>更新日志</h1>
        <p>记录财讯雷达的信息组织、抓取渠道和安全修复进展。</p>
      </div>
      <section className="changelog-list">
        <article><time>2026-06-15</time><h2>自动更新通道恢复</h2><p>修复 Worker 缺少数据库/Redis 环境变量导致的定时任务失败，新增 `queue:check` 队列自检命令。</p></article>
        <article><time>2026-06-15</time><h2>首页对齐热点站结构</h2><p>新增日期头、分类入口、信源数、推荐理由、当前热点、时间线、反馈和信源提报入口。</p></article>
        <article><time>2026-06-15</time><h2>红军审查与蓝军修复</h2><p>清理低价值 SEC filing，修复行情方向误判，公开 API 只返回已发布内容，后台匿名访问返回 401。</p></article>
      </section>
    </main>
  );
}
