import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SourceAdapter, SourceStory } from "@finance-radar/domain";
import { RuleBasedAIProvider } from "./adapters.js";
import { clusterStories, deduplicateStories, processSources } from "./pipeline.js";
import { createSignedSyncRequest } from "./sync.js";
import { RssAtomFeedAdapter } from "./adapters.js";
import { containsChinese, needsTranslation } from "./localization.js";

const story: SourceStory = {
  id: "1", sourceName: "监管机构", sourceType: "官网", title: "某公司发布经营公告",
  url: "https://example.com/a?utm_source=test", publishedAt: new Date().toISOString(),
};

describe("pipeline", () => {
  it("deduplicates tracking variants", () => {
    assert.equal(deduplicateStories([story, { ...story, id: "2", url: "https://example.com/a" }]).length, 1);
  });

  it("continues when one source fails", async () => {
    const ok: SourceAdapter = { id: "ok", fetch: async () => [story, { ...story, id: "2", sourceName: "交易所", url: "https://other.example/a" }] };
    const bad: SourceAdapter = { id: "bad", fetch: async () => { throw new Error("offline"); } };
    const result = await processSources([ok, bad], new RuleBasedAIProvider(), new Date());
    assert.equal(result.length, 1);
    assert.equal(result[0]?.status, "published");
  });

  it("clusters Chinese market headlines by event terms, not URL only", () => {
    const first: SourceStory = {
      ...story,
      id: "market-1",
      title: "沪指重回4000点，上证涨幅超1%，小金属与商业航天板块领涨",
      url: "https://example.com/market/a",
    };
    const second: SourceStory = {
      ...story,
      id: "market-2",
      sourceName: "交易所",
      title: "上证指数涨超1%，沪指重回4000点，市场情绪回暖",
      url: "https://other.example/market/b",
    };
    assert.equal(clusterStories([first, second]).length, 1);
  });
});

describe("mirror signature", () => {
  it("signs timestamp, nonce and exact body", () => {
    const request = createSignedSyncRequest('{"hello":"world"}', "secret", 123);
    assert.equal(request.headers["x-sync-timestamp"], "123");
    assert.match(request.headers["x-sync-signature"], /^[a-f0-9]{64}$/);
  });
});

describe("RSS and Atom adapter", () => {
  it("parses and filters official feed records", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(`<?xml version="1.0"?><rss><channel><item><title>Policy update</title><link>https://example.com/policy</link><pubDate>Sun, 15 Jun 2026 12:00:00 GMT</pubDate></item></channel></rss>`);
    try {
      const adapter = new RssAtomFeedAdapter({ id: "test", sourceName: "官方来源", sourceType: "官方 RSS", feedUrl: "https://example.com/feed.xml" });
      const result = await adapter.fetch(new Date("2026-06-15T00:00:00Z"));
      assert.equal(result.length, 1);
      assert.equal(result[0]?.title, "Policy update");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("Chinese localization guard", () => {
  it("detects English and mixed-language sentences", () => {
    assert.equal(containsChinese("货币政策决定"), true);
    assert.equal(needsTranslation("Monetary policy decisions"), true);
    assert.equal(needsTranslation("美联储 announces a final policy decision"), true);
    assert.equal(needsTranslation("Christine Lagarde: Money in transition"), true);
    assert.equal(needsTranslation("货币政策声明 (with Q&A)"), true);
    assert.equal(needsTranslation("美联储发布最终政策决定"), false);
    assert.equal(needsTranslation("机构持仓报告：SIMA Wealth Partners, LLC"), false);
  });
});
