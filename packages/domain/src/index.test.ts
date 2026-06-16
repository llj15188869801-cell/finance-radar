import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeUrl, shouldAutoPublish } from "./index.js";

const source = (sourceName: string) => ({
  id: sourceName,
  sourceName,
  sourceType: "官方 RSS",
  title: "标题",
  url: `https://example.com/${sourceName}`,
  publishedAt: new Date().toISOString(),
});

describe("publishing policy", () => {
  it("requires confidence, multiple sources and explicit risks", () => {
    assert.equal(shouldAutoPublish({ confidence: 0.9, sources: [source("A"), source("B")], risks: ["仍待确认"] }), true);
    assert.equal(shouldAutoPublish({ confidence: 0.9, sources: [source("A"), source("A")], risks: ["仍待确认"] }), false);
  });
});

describe("normalizeUrl", () => {
  it("drops tracking parameters and fragments", () => {
    assert.equal(normalizeUrl("https://EXAMPLE.com/a/?utm_source=x#part"), "https://example.com/a");
  });
});
