import test from "node:test";
import assert from "node:assert/strict";
import {
  REVIEW_INTERVAL_DAYS,
  formatDate,
  todayString,
  addDaysToDateString,
  createInitialProgress,
  resetDailyCountIfNeeded,
  getDueQuestions,
  getUnseenQuestions,
  countRemainingNewSlots,
  buildSession,
  requeueOnMiss,
  applyAnswer,
  computeStageCounts,
  computeCategoryStats,
  computeMasteredCount,
  getWeakItems,
} from "../js/lib/scheduler.js";

const noShuffle = (arr) => [...arr];

function makeQuestions(ids) {
  return ids.map((id) => ({ id, category: "テスト", grade: 1 }));
}

test("formatDate は YYYY-MM-DD 形式", () => {
  assert.equal(formatDate(new Date(2026, 0, 5)), "2026-01-05");
});

test("todayString は Date から今日の文字列を作る", () => {
  assert.equal(todayString(new Date(2026, 8, 6)), "2026-09-06");
});

test("addDaysToDateString は日をまたいで正しく計算する（月末越え）", () => {
  assert.equal(addDaysToDateString("2026-01-30", 3), "2026-02-02");
});

test("addDaysToDateString(0) は同じ日を返す", () => {
  assert.equal(addDaysToDateString("2026-05-01", 0), "2026-05-01");
});

test("REVIEW_INTERVAL_DAYS は box0〜5 に対応する6要素", () => {
  assert.deepEqual(REVIEW_INTERVAL_DAYS, [0, 1, 3, 7, 14, 30]);
});

test("resetDailyCountIfNeeded: 日付が同じなら変化しない", () => {
  const progress = { ...createInitialProgress(), day: "2026-09-06", newDoneToday: 3 };
  const result = resetDailyCountIfNeeded(progress, "2026-09-06");
  assert.equal(result.newDoneToday, 3);
});

test("resetDailyCountIfNeeded: 日付が変わったら newDoneToday が0に戻る", () => {
  const progress = { ...createInitialProgress(), day: "2026-09-05", newDoneToday: 7 };
  const result = resetDailyCountIfNeeded(progress, "2026-09-06");
  assert.equal(result.newDoneToday, 0);
  assert.equal(result.day, "2026-09-06");
});

test("getDueQuestions: due <= today のカードだけ集める", () => {
  const questions = makeQuestions(["a", "b", "c"]);
  const progress = {
    ...createInitialProgress(),
    cards: {
      a: { box: 1, due: "2026-09-05", seen: 1, correct: 1 },
      b: { box: 1, due: "2026-09-06", seen: 1, correct: 1 },
      c: { box: 1, due: "2026-09-07", seen: 1, correct: 1 },
    },
  };
  const due = getDueQuestions(questions, progress, "2026-09-06");
  assert.deepEqual(due.map((q) => q.id), ["a", "b"]);
});

test("getUnseenQuestions: カードが存在しない問題のみ", () => {
  const questions = makeQuestions(["a", "b"]);
  const progress = { ...createInitialProgress(), cards: { a: { box: 0, due: "2026-09-06", seen: 1, correct: 0 } } };
  const unseen = getUnseenQuestions(questions, progress);
  assert.deepEqual(unseen.map((q) => q.id), ["b"]);
});

test("countRemainingNewSlots: newPerDay - newDoneToday（負にならない）", () => {
  assert.equal(countRemainingNewSlots({ newPerDay: 10, newDoneToday: 3 }), 7);
  assert.equal(countRemainingNewSlots({ newPerDay: 10, newDoneToday: 15 }), 0);
});

test("buildSession: 復習分と新規分（残り枠まで）をあわせて返す", () => {
  const questions = makeQuestions(["due1", "due2", "new1", "new2", "new3"]);
  const progress = {
    ...createInitialProgress(2),
    cards: {
      due1: { box: 1, due: "2026-09-06", seen: 1, correct: 1 },
      due2: { box: 1, due: "2026-09-06", seen: 1, correct: 1 },
    },
  };
  const session = buildSession(questions, progress, "2026-09-06", noShuffle);
  assert.deepEqual(
    session.map((q) => q.id).sort(),
    ["due1", "due2", "new1", "new2"].sort()
  );
});

test("buildSession: newDoneToday が newPerDay に達していたら新規は0件", () => {
  const questions = makeQuestions(["new1", "new2"]);
  const progress = { ...createInitialProgress(2), newDoneToday: 2 };
  const session = buildSession(questions, progress, "2026-09-06", noShuffle);
  assert.deepEqual(session, []);
});

test("requeueOnMiss: miss のときだけ同一セッション末尾に再度積む", () => {
  const session = ["q1", "q2", "q3"];
  const requeued = requeueOnMiss(session, 1, "miss");
  assert.deepEqual(requeued, ["q1", "q2", "q3", "q2"]);
});

test("requeueOnMiss: sure/guess では何もしない", () => {
  const session = ["q1", "q2"];
  assert.deepEqual(requeueOnMiss(session, 0, "sure"), session);
  assert.deepEqual(requeueOnMiss(session, 0, "guess"), session);
});

test("applyAnswer sure: box が+1され、該当日数後が due になる", () => {
  const progress = { ...createInitialProgress(), cards: { q1: { box: 2, due: "2026-09-01", seen: 3, correct: 2 } } };
  const next = applyAnswer(progress, "q1", "sure", "2026-09-06");
  assert.equal(next.cards.q1.box, 3);
  assert.equal(next.cards.q1.due, addDaysToDateString("2026-09-06", REVIEW_INTERVAL_DAYS[3]));
  assert.equal(next.cards.q1.seen, 4);
  assert.equal(next.cards.q1.correct, 3);
});

test("applyAnswer sure: box は5が上限", () => {
  const progress = { ...createInitialProgress(), cards: { q1: { box: 5, due: "2026-09-01", seen: 10, correct: 9 } } };
  const next = applyAnswer(progress, "q1", "sure", "2026-09-06");
  assert.equal(next.cards.q1.box, 5);
  assert.equal(next.cards.q1.due, addDaysToDateString("2026-09-06", 30));
});

test("applyAnswer guess: box は据え置き、due は翌日、correct は加算される", () => {
  const progress = { ...createInitialProgress(), cards: { q1: { box: 2, due: "2026-09-01", seen: 3, correct: 2 } } };
  const next = applyAnswer(progress, "q1", "guess", "2026-09-06");
  assert.equal(next.cards.q1.box, 2);
  assert.equal(next.cards.q1.due, "2026-09-07");
  assert.equal(next.cards.q1.correct, 3);
});

test("applyAnswer miss: box は0に戻り、due は当日、correct は増えない", () => {
  const progress = { ...createInitialProgress(), cards: { q1: { box: 4, due: "2026-09-01", seen: 3, correct: 2 } } };
  const next = applyAnswer(progress, "q1", "miss", "2026-09-06");
  assert.equal(next.cards.q1.box, 0);
  assert.equal(next.cards.q1.due, "2026-09-06");
  assert.equal(next.cards.q1.correct, 2);
  assert.equal(next.cards.q1.seen, 4);
});

test("applyAnswer: 新規問題への初回回答で newDoneToday が+1される", () => {
  const progress = createInitialProgress();
  const next = applyAnswer(progress, "q1", "sure", "2026-09-06");
  assert.equal(next.newDoneToday, 1);
});

test("applyAnswer: 既存カードへの再回答では newDoneToday は増えない", () => {
  const progress = { ...createInitialProgress(), cards: { q1: { box: 0, due: "2026-09-06", seen: 1, correct: 0 } } };
  const next = applyAnswer(progress, "q1", "miss", "2026-09-06");
  assert.equal(next.newDoneToday, 0);
});

test("computeStageCounts: box1〜5 の件数を集計する", () => {
  const progress = {
    ...createInitialProgress(),
    cards: {
      a: { box: 1, due: "x", seen: 1, correct: 1 },
      b: { box: 1, due: "x", seen: 1, correct: 1 },
      c: { box: 3, due: "x", seen: 1, correct: 1 },
      d: { box: 0, due: "x", seen: 1, correct: 0 },
    },
  };
  assert.deepEqual(computeStageCounts(progress), [2, 0, 1, 0, 0]);
});

test("computeCategoryStats: 正答率の低い順に並べ、未回答の分野は含めない", () => {
  const questions = [
    { id: "a", category: "三単現" },
    { id: "b", category: "三単現" },
    { id: "c", category: "関係代名詞" },
    { id: "d", category: "未出題分野" },
  ];
  const progress = {
    ...createInitialProgress(),
    cards: {
      a: { box: 1, due: "x", seen: 4, correct: 1 },
      b: { box: 1, due: "x", seen: 4, correct: 3 },
      c: { box: 1, due: "x", seen: 2, correct: 2 },
    },
  };
  const stats = computeCategoryStats(questions, progress);
  assert.deepEqual(
    stats.map((s) => s.category),
    ["三単現", "関係代名詞"]
  );
  assert.equal(stats[0].seen, 8);
  assert.equal(stats[0].correct, 4);
  assert.equal(stats[0].rate, 0.5);
  assert.equal(stats[1].rate, 1);
});

test("computeMasteredCount: box がしきい値(既定3)以上のカード数を数える", () => {
  const progress = {
    ...createInitialProgress(),
    cards: {
      a: { box: 3, due: "x", seen: 1, correct: 1 },
      b: { box: 5, due: "x", seen: 1, correct: 1 },
      c: { box: 2, due: "x", seen: 1, correct: 1 },
    },
  };
  assert.equal(computeMasteredCount(progress), 2);
});

test("getWeakItems: 誤答歴のある項目だけを誤答数の多い順に返す", () => {
  const questions = makeQuestions(["a", "b", "c", "d"]);
  const progress = {
    ...createInitialProgress(),
    cards: {
      a: { box: 1, due: "x", seen: 5, correct: 2 }, // wrong 3
      b: { box: 1, due: "x", seen: 3, correct: 3 }, // wrong 0 (除外)
      c: { box: 1, due: "x", seen: 4, correct: 3 }, // wrong 1
      // d は未回答（除外）
    },
  };
  const weak = getWeakItems(questions, progress);
  assert.deepEqual(
    weak.map((w) => w.id),
    ["a", "c"]
  );
  assert.equal(weak[0].wrongCount, 3);
  assert.equal(weak[1].wrongCount, 1);
});
