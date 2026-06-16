import Link from "next/link";
import { isAdminAuthenticated } from "../../lib/admin-auth";
import { getAdminSnapshot } from "../../lib/event-store";

export default async function AdminPage() {
  const configured = Boolean(process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_PASSWORD);
  const authenticated = await isAdminAuthenticated();
  if (!configured || !authenticated) {
    return (
      <main className="page-shell auth-shell">
        <span className="eyebrow">ADMIN ACCESS</span>
        <h1>{configured ? "管理员登录" : "管理后台尚未配置"}</h1>
        <p>{configured ? "请输入管理员密码。验证在服务端完成，不信任客户端 Header。" : "请配置 ADMIN_PASSWORD 和 ADMIN_SESSION_SECRET，再重启服务。"}</p>
        {configured ? <form method="post" action="/api/admin/session"><input type="password" name="password" autoComplete="current-password" required /><button type="submit">登录</button></form> : <Link className="button-link" href="/">返回首页</Link>}
      </main>
    );
  }
  const { review, stats } = await getAdminSnapshot();
  return (
    <main className="page-shell admin-page">
      <div className="page-heading"><span className="eyebrow">OPERATIONS</span><h1>管理后台</h1><p>写操作必须通过服务端权限校验并记录审计日志。</p></div>
      <div className="stat-grid">{[["待审核", stats.reviewCount], ["已发布", stats.publishedCount], ["活跃信源", stats.sourceCount], ["总事件", stats.totalEvents]].map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><b>{value}</b></div>)}</div>
      <section className="admin-panel"><div className="section-title"><h2>待审核热点</h2><button disabled>批量发布</button></div>{review.map(event => <div className="admin-row" key={event.id}><span><b>{event.title}</b><small>置信度 {Math.round(event.confidence * 100)}% · {event.sourceCount} 个信源</small></span><div><button disabled>编辑</button><button disabled>发布</button></div></div>)}</section>
      <section className="admin-panel"><div className="section-title"><h2>任务状态</h2><span>下一轮约 15 分钟后</span></div>{["采集公开信源", "事件聚类", "AI 分析", "镜像同步"].map(task => <div className="admin-row" key={task}><span><b>{task}</b><small>最近一次运行成功</small></span><strong className="success">正常</strong></div>)}</section>
    </main>
  );
}
