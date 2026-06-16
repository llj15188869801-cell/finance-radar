import { EventCard } from "../../components/EventCard";
import { getFeaturedEvents } from "../../lib/live-data";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const publishedEvents = await getFeaturedEvents(20);
  const today = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeZone: "America/Tijuana" }).format(new Date());
  const lead = publishedEvents.slice(0, 3).map((event) => event.category).join("、") || "暂无自动精选";
  return (
    <main className="page-shell daily-page">
      <div className="daily-cover"><span className="eyebrow">FINANCE RADAR DAILY</span><h1>每日财经简报</h1><p>{today}</p><b>今日核心：{lead} 是当前自动精选里最值得先看的市场信号。</b></div>
      <section><div className="section-title"><h2>01 宏观与市场</h2><span>{publishedEvents.length} 篇</span></div>{publishedEvents.filter(e => e.markets.includes("宏观")).map(e => <EventCard event={e} compact key={e.id} />)}</section>
      <section><div className="section-title"><h2>02 产业与公司</h2><span>{publishedEvents.length} 篇</span></div>{publishedEvents.filter(e => !e.markets.includes("宏观")).map(e => <EventCard event={e} compact key={e.id} />)}</section>
    </main>
  );
}
