import { EventCard } from "../../components/EventCard";
import { getLiveEvents } from "../../lib/live-data";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const events = await getLiveEvents();
  const query = q.trim().toLowerCase();
  const results = events.filter(event => [event.title, event.summary, event.category, ...event.assets.map(a => a.name)].join(" ").toLowerCase().includes(query));
  return <main className="page-shell"><div className="page-heading"><span className="eyebrow">SEARCH</span><h1>搜索结果</h1><p>{query ? `“${q}” 找到 ${results.length} 条相关事件` : "输入公司、行业或事件关键词。"}</p></div><div className="event-list">{results.map(event => <EventCard event={event} key={event.id} />)}</div></main>;
}
