import { EventCard } from "../../components/EventCard";
import { AutoRefresh } from "../../components/AutoRefresh";
import { markets } from "../../lib/data";
import { getLiveEvents } from "../../lib/live-data";

export const dynamic = "force-dynamic";

export default async function AllPage({ searchParams }: { searchParams: Promise<{ market?: string; category?: string }> }) {
  const { market = "全部", category = "全部" } = await searchParams;
  const events = await getLiveEvents();
  const categories = ["全部", ...Array.from(new Set(events.map((event) => event.category)))];
  const byMarket = market === "全部" ? events : events.filter((event) => event.markets.includes(market as never));
  const filtered = category === "全部" ? byMarket : byMarket.filter((event) => event.category === category);
  return (
    <main className="page-shell">
      <AutoRefresh />
      <div className="page-heading"><span className="eyebrow">ALL SIGNALS</span><h1>全部精选</h1><p>已过滤常规申报、重复快讯和低价值流水，只展示值得继续跟踪的市场信号。</p></div>
      <div className="filter-row">{markets.map((item) => <a className={market === item ? "active" : ""} href={`/all?market=${encodeURIComponent(item)}`} key={item}>{item}</a>)}</div>
      <div className="filter-row">{categories.map((item) => <a className={category === item ? "active" : ""} href={`/all?category=${encodeURIComponent(item)}${market !== "全部" ? `&market=${encodeURIComponent(market)}` : ""}`} key={item}>{item}</a>)}</div>
      <div className="event-list">{filtered.map((event) => <EventCard event={event} key={event.id} />)}</div>
    </main>
  );
}
