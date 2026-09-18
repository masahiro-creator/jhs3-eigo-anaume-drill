import test from "node:test";
import assert from "node:assert/strict";
import { WORDS } from "../js/data/words.js";
import { validateWords } from "../js/lib/validateWords.js";

test("全単語データが受け入れ条件の型チェックを通る", () => {
  const errors = validateWords(WORDS);
  assert.deepEqual(errors, []);
});

test("id は一意で w[grade]_NNN 形式", () => {
  const ids = WORDS.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^w[123]_\d{3}$/));
});

test("各学年に少なくとも1語ある", () => {
  const grades = new Set(WORDS.map((w) => w.grade));
  assert.ok(grades.has(1));
  assert.ok(grades.has(2));
  assert.ok(grades.has(3));
});

test("総語数は約1400語", () => {
  assert.ok(WORDS.length > 1300 && WORDS.length < 1450, `unexpected count: ${WORDS.length}`);
});
