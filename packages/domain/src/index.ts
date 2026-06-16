import { z } from "zod";

export const marketSchema = z.enum(["A股", "港股", "美股", "宏观"]);
export const eventStatusSchema = z.enum(["draft", "review", "published", "withdrawn"]);

export const sourceStorySchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  sourceType: z.string(),
  title: z.string(),
  url: z.string().url(),
  publishedAt: z.string(),
});

export const assetReferenceSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  market: marketSchema,
  relation: z.string(),
});

export const hotEventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  importance: z.string(),
  impact: z.string(),
  risks: z.array(z.string()),
  uncertainty: z.string(),
  category: z.string(),
  markets: z.array(marketSchema),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  status: eventStatusSchema,
  publishedAt: z.string(),
  sources: z.array(sourceStorySchema),
  assets: z.array(assetReferenceSchema),
});

export type Market = z.infer<typeof marketSchema>;
export type HotEvent = z.infer<typeof hotEventSchema>;
export type SourceStory = z.infer<typeof sourceStorySchema>;
export type AssetReference = z.infer<typeof assetReferenceSchema>;

export interface SourceAdapter {
  readonly id: string;
  fetch(since: Date): Promise<SourceStory[]>;
}

export interface AIProvider {
  analyze(stories: SourceStory[]): Promise<Pick<HotEvent, "summary" | "importance" | "impact" | "risks" | "uncertainty" | "confidence">>;
}

export function shouldAutoPublish(event: Pick<HotEvent, "confidence" | "sources" | "risks">) {
  const distinctSources = new Set(event.sources.map((source) => source.sourceName));
  return event.confidence >= 0.82 && distinctSources.size >= 2 && event.risks.length > 0;
}

export function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) =>
    url.searchParams.delete(key),
  );
  url.hostname = url.hostname.toLowerCase();
  return url.toString().replace(/\/$/, "");
}
