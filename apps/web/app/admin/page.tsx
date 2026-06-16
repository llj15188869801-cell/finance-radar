import Link from "next/link";
import { isAdminAuthenticated } from "../../lib/admin-auth";
import { getAdminSnapshot } from "../../lib/event-store";
import type { HotEvent } from "@finance-radar/domain";

const LABELS = {
  review: "待审核",
  published: "已发布",
  sourceCount: "活跃信源",
  totalEvents: "总事件",
  reviewTitle: "待审核热点",
  batchPublish: "批量发布",
  edit: "编辑",
  publish: "发布",
  taskStatus: "任务状态",
  nextRound: "下一轮约 15 分钟后",
  tasks: ["采集公开信源", "事件聚类", "AI 分析", "镜像同步"],
  adminTitle: "管理后台",
  adminDesc: "写操作必须通过服务端权限校验并记录审计日志。",
  loginTitle: "管理员登录",
  loginDesc: "请输入管理员密码。验证在服务端完成，不信任客户端 Header。",
  configMissingTitle: "管理后台尚未配置",
  configMissingDesc: "请配置 ADMIN_PASSWORD 和 ADMIN_SESSION_SECRET，再重启服务。",
  backToHome: "返回首页",
  loginBtn: "登录",
} as const;

export default async function AdminPage() {
  const configured = Boolean(process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_PASSWORD);
  const authenticated = await isAdminAuthenticated();
  if (!configured || !authenticated) {
    return (
      <main className="page-shell auth-shell">
        <span className="eyebrow">ADMIN ACCESS</span>
        <h1>{configured ? LABELS.loginTitle : LABELS.configMissingTitle}</h1>
        <p>{configured ? LABELS.loginDesc : LABELS.configMissingDesc}</p>
        {configured ? <form method="post" action="/api/admin/session"><input type="password" name="password" autoComplete="current-password" required /><button type="submit">{LABELS.loginBtn}</button></form> : <Link className="button-link" href="/">{LABELS.backToHome}</Link>}
      </main>
    );
  }
  const { review, stats } = await getAdminSnapshot();
  return (
    <main className="page-shell admin-page">
      <div className="page-heading"><span className="eyebrow">OPERATIONS</span><h1>{LABELS.adminTitle}</h1><p>{LABELS.adminDesc}</p></div>
      <div className="stat-grid">{[[LABELS.review, stats.reviewCount], [LABELS.published, stats.publishedCount], [LABELS.sourceCount, stats.sourceCount], [LABELS.totalEvents, stats.totalEvents]].map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><b>{value}</b></div>)}</div>
      <section className="admin-panel"><div className="section-title"><h2>{LABELS.reviewTitle}</h2><button disabled>{LABELS.batchPublish}</button></div>{review.map((event: HotEvent) => <div className="admin-row" key={event.id}><span><b>{event.title}</b><small>置信度 {Math.round(event.confidence * 100)}% · {event.sources.length} 个信源</small></span><div><button disabled>{LABELS.edit}</button><button disabled>{LABELS.publish}</button></div></div>)}</section>
      <section className="admin-panel"><div className="section-title"><h2>{LABELS.taskStatus}</h2><span>{LABELS.nextRound}</span></div>{LABELS.tasks.map(task => <div className="task-row" key={task}><span><b>{task}</b><small>等待执行</small></span><i/></div>)}</section>
    </main>
  );
}
