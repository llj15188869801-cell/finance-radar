import type { HotEvent } from "@finance-radar/domain";
import Link from "next/link";
import { eventReason, eventTags, formatEventTime, sourceCount, timeAgo } from "../lib/presentation";

export function EventCard({ event, compact = false }: { event: HotEvent; compact?: boolean }) {
  return (
    <article className={`event-card ${compact ? "compact" : ""}`}>
      <div className="event-meta">
        <span className="score">{event.score}</span>
        <span>{formatEventTime(event.publishedAt)}</span>
        <span>{sourceCount(event)} 信源</span>
        <span>{event.category}</span>
        <span>{timeAgo(event.publishedAt)}</span>
      </div>
      <Link href={`/events/${event.slug}`}><h3>{event.title}</h3></Link>
      <p>{event.summary}</p>
      <div className="reason-box"><b>推荐理由：</b>{eventReason(event)}</div>
      <p className="muted">仅供信息参考，不构成投资建议。</p>
      <div className="tag-row">
        {eventTags(event).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </article>
  );
}
