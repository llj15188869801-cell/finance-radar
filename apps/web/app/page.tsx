import Link from "next/link";
import { EventCard } from "../components/EventCard";
import { AutoRefresh } from "../components/AutoRefresh";
import { getFeaturedEvents, getLiveEvents } from "../lib/live-data";
import { eventReason, formatEventDay, formatEventTime, formatSiteDate, groupEventsByDay, sourceCount, timeAgo } from "../lib/presentation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const liveEvents = await getLiveEvents(60);
  const featuredEvents = await getFeaturedEvents(20);
  const top = featuredEvents.slice(0, 3);
  const categories = ["全部", ...Array.from(new Set(liveEvents.map((event) => event.category)))].slice(0, 8);
  const categoryCounts = liveEvents.reduce<Record<string, number>>((counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1;
    return counts;
  }, {});
  const assets = liveEvents.flatMap((event) => event.assets);
  const marketStrip = ["上证指数", "恒生指数", "标普500指数", "WTI原油"]
    .map((name) => assets.find((asset) => asset.name === name))
    .filter((asset) => asset !== undefined);
  return (
    <main>
      <AutoRefresh />
      <section className="date-kicker">
        <span>财讯雷达</span>
        <b>{formatSiteDate()}</b>
        <small>自动抓取 · 中文整理 · 15 分钟刷新</small>
      </section>
      <section className="hero">
        <div>
          <span className="eyebrow">只看真正影响市场的事</span>
          <h1>看懂今天的市场，<br />不被情绪带着走。</h1>
          <p>过滤申报流水和重复快讯，只保留政策变化、监管规则与重要市场信号。</p>
        </div>
        <div className="radar-panel">
          <div className="radar-circle"><span>今日<br /><b>{liveEvents.length}</b><br />条精选</span></div>
          <p>最近更新：{featuredEvents[0] ? timeAgo(featuredEvents[0].publishedAt) : "暂无"}</p>
        </div>
      </section>

      <section className="market-strip">
        {marketStrip.map((asset) => (
          <div key={asset.symbol}><span>{asset.name}</span><b>{asset.relation}</b><small>公开行情参考 · 可能延迟</small></div>
        ))}
      </section>

      <section className="section-block">
        <div className="section-title"><div><span className="eyebrow">TODAY'S TOP</span><h2>今日热点 TOP 3</h2></div><Link href="/all">查看全部精选 →</Link></div>
        <div className="top-grid">
          {top.map((event, index) => (
            <Link href={`/events/${event.slug}`} className="top-story" key={event.id}>
              <span className="top-rank">0{index + 1}</span>
              <div><h3>{event.title}</h3><p>{sourceCount(event)} 信源 · {timeAgo(event.publishedAt)} · 关注度 {event.score}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-grid section-block">
        <div>
          <div className="section-title"><div><span className="eyebrow">CURATED</span><h2>最新精选</h2></div></div>
          <div className="filter-row category-tabs">
            {categories.map((category) => <Link href={category === "全部" ? "/all" : `/all?category=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}
          </div>
          <div className="event-list">{featuredEvents.map((event) => <EventCard event={event} key={event.id} />)}</div>
        </div>
        <aside>
          <div className="aside-card">
            <span className="eyebrow">TODAY'S FOCUS</span><h3>本期精选构成</h3>
            {Object.entries(categoryCounts).map(([category, count]) => <div className="bar-item" key={category}><span>{category} {count} 条</span><i /></div>)}
          </div>
          <div className="aside-card hot-list">
            <span className="eyebrow">CURRENT HOT</span><h3>当前热点</h3>
            {top.map((event, index) => (
              <Link href={`/events/${event.slug}`} key={event.id}>
                <b>{index + 1}</b>
                <span>{event.title}<small>{sourceCount(event)} 信源 · {event.category}</small></span>
              </Link>
            ))}
          </div>
          <div className="aside-card"><span className="eyebrow">DAILY BRIEF</span><h3>每日财经简报</h3><p>用 5 分钟了解一天里真正值得关注的市场变化。</p><Link className="button-link" href="/daily">阅读今日简报</Link></div>
          <div className="aside-card"><span className="eyebrow">CONTRIBUTE</span><h3>信源提报</h3><p>发现稳定、公开、可引用的财经信源，可以加入候选池。</p><Link className="button-link" href="/sources">提交信源线索</Link></div>
        </aside>
      </section>

      <section className="section-block timeline-section">
        <div className="section-title"><div><span className="eyebrow">TIMELINE</span><h2>热点时间线</h2></div><Link href="/daily">查看日报 →</Link></div>
        {groupEventsByDay(liveEvents).map((group) => (
          <div className="day-group" key={group.day}>
            <h3>{group.day}</h3>
            {group.items.slice(0, 8).map((event) => (
              <Link href={`/events/${event.slug}`} className="timeline-row" key={event.id}>
                <time>{formatEventDay(event.publishedAt) === group.day ? formatEventTime(event.publishedAt) : ""}</time>
                <span><b>{event.title}</b><small>{event.category} · {sourceCount(event)} 信源 · 推荐理由：{eventReason(event)}</small></span>
                <i>{event.score}</i>
              </Link>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
