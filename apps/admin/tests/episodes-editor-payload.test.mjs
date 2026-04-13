import assert from "node:assert/strict";
import test from "node:test";

import { toEpisodeRequestPayload } from "../src/features/episodes/transformers.ts";

test("toEpisodeRequestPayload maps publish action to active true and auto publish date", () => {
  const payload = toEpisodeRequestPayload({
    action: "publish",
    values: {
      title: "  Episode 42  ",
      shortDescription: "  Summary  ",
      description: "  Long body  ",
      url: "https://example.com/episode.mp3",
      imageUrl: "https://example.com/cover.jpg",
      tags: "react, architecture, react",
      publishedAt: "",
      number: "42",
      categoryId: "7"
    }
  });

  assert.equal(payload.title, "Episode 42");
  assert.equal(payload.active, true);
  assert.deepEqual(payload.tags, ["react", "architecture"]);
  assert.equal(payload.number, 42);
  assert.equal(payload.categoryId, 7);
  assert.equal(typeof payload.publishedAt, "string");
  assert.ok(payload.publishedAt.length > 0);
});

test("toEpisodeRequestPayload maps draft action to active false and preserves explicit published date", () => {
  const payload = toEpisodeRequestPayload({
    action: "save-draft",
    values: {
      title: "Episode draft",
      shortDescription: "",
      description: "",
      url: "",
      imageUrl: "",
      tags: "",
      publishedAt: "2026-03-29T18:00",
      number: "",
      categoryId: ""
    }
  });

  assert.equal(payload.active, false);
  assert.equal(payload.publishedAt, "2026-03-29T18:00");
  assert.equal(payload.number, undefined);
  assert.equal(payload.categoryId, undefined);
  assert.equal(payload.tags, undefined);
});
