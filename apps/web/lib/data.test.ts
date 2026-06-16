import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { events, findEvent, publishedEvents } from "./data";

describe("demo content", () => {
  it("never exposes review events in the public feed", () => {
    assert.equal(publishedEvents.every((event) => event.status === "published"), true);
  });

  it("resolves every event slug", () => {
    assert.equal(events.every((event) => findEvent(event.slug)?.id === event.id), true);
  });

  it("published events have accessible sources and risk notes", () => {
    assert.equal(publishedEvents.every((event) => event.sources.length > 0 && event.risks.length > 0), true);
  });
});
