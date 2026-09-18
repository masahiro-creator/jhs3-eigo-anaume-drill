import test from "node:test";
import assert from "node:assert/strict";
import { updateStreak } from "../js/lib/streak.js";

test("updateStreak: 初回は1になる", () => {
  const result = updateStreak({ lastActiveDate: "", count: 0 }, "2026-09-18");
  assert.deepEqual(result, { lastActiveDate: "2026-09-18", count: 1 });
});

test("updateStreak: 前日から続いていれば+1", () => {
  const result = updateStreak({ lastActiveDate: "2026-09-17", count: 4 }, "2026-09-18");
  assert.deepEqual(result, { lastActiveDate: "2026-09-18", count: 5 });
});

test("updateStreak: 間が空いたら1にリセット", () => {
  const result = updateStreak({ lastActiveDate: "2026-09-10", count: 7 }, "2026-09-18");
  assert.deepEqual(result, { lastActiveDate: "2026-09-18", count: 1 });
});

test("updateStreak: 同じ日に複数回呼んでも変化しない", () => {
  const state = { lastActiveDate: "2026-09-18", count: 3 };
  const result = updateStreak(state, "2026-09-18");
  assert.deepEqual(result, state);
});
