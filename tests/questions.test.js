import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../js/data/questions.js";
import { validateQuestions } from "../js/lib/validate.js";

test("全問題データが受け入れ条件の型チェックを通る", () => {
  const errors = validateQuestions(QUESTIONS);
  assert.deepEqual(errors, []);
});

test("id は一意で q001 形式", () => {
  const ids = QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^q\d{3}$/));
});

test("各学年に少なくとも1問ある", () => {
  const grades = new Set(QUESTIONS.map((q) => q.grade));
  assert.ok(grades.has(1));
  assert.ok(grades.has(2));
  assert.ok(grades.has(3));
});
