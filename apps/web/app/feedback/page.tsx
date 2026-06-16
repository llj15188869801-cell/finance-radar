export default function FeedbackPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">FEEDBACK</span>
        <h1>反馈</h1>
        <p>用于收集错误信源、误判热点、缺失分类和页面建议。请不要提交账号、密码、API Key 或完整个人资料。</p>
      </div>
      <section className="feedback-box">
        <h2>建议反馈内容</h2>
        <ul>
          <li>哪条热点标题或摘要不准确。</li>
          <li>哪个信源应该加入或移除。</li>
          <li>某个事件是否被错误分类或重复展示。</li>
          <li>页面上你最希望补充的市场或栏目。</li>
        </ul>
        <p className="muted">当前 MVP 不自动发送表单，正式部署前会接入服务端反馈 API 与审核队列。</p>
      </section>
    </main>
  );
}
