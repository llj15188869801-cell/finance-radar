import type { HotEvent } from "@finance-radar/domain";

export function formatSiteDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "America/Tijuana",
  }).formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  return `${month}${day} · ${weekday}`;
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export function formatEventDay(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export function timeAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.round(hours / 24)}天前`;
}

export function sourceCount(event: HotEvent) {
  return new Set(event.sources.map((source) => source.sourceName)).size || event.sources.length;
}

export function eventReason(event: HotEvent) {
  if (event.importance && event.importance !== event.summary) return event.importance;
  return event.impact || event.summary;
}

export function eventTags(event: HotEvent) {
  return [
    event.category,
    ...event.markets,
    ...event.assets.slice(0, 2).map((asset) => asset.name),
  ].filter(Boolean).slice(0, 5);
}

export function groupEventsByDay(events: HotEvent[]) {
  const groups = new Map<string, HotEvent[]>();
  for (const event of events) {
    const day = formatEventDay(event.publishedAt);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return [...groups.entries()].map(([day, items]) => ({ day, items }));
}
