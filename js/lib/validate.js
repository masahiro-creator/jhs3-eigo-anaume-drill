/**
 * 問題データの整合性チェック。UI・保存処理には依存しない純粋関数。
 * @param {import('../data/questions.js').Question[]} questions
 * @returns {string[]} エラーメッセージの配列。問題なければ空配列。
 */
export function validateQuestions(questions) {
  const errors = [];
  const seenIds = new Set();

  questions.forEach((q) => {
    if (seenIds.has(q.id)) errors.push(`${q.id}: id が重複している`);
    seenIds.add(q.id);

    if (![1, 2, 3].includes(q.grade)) errors.push(`${q.id}: grade は1〜3である必要がある`);
    if (!q.sentence.includes("___")) errors.push(`${q.id}: sentence に ___ が含まれていない`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`${q.id}: choices は4つ必要`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      errors.push(`${q.id}: answer が0〜3の範囲外`);
    }
    if (!Array.isArray(q.wrongReasons) || q.wrongReasons.length !== 4) {
      errors.push(`${q.id}: wrongReasons は4つ必要`);
    } else {
      q.wrongReasons.forEach((reason, i) => {
        const shouldBeEmpty = i === q.answer;
        if (shouldBeEmpty && reason !== "") {
          errors.push(`${q.id}: wrongReasons[${i}] は正解の位置なので空文字である必要がある`);
        }
        if (!shouldBeEmpty && reason === "") {
          errors.push(`${q.id}: wrongReasons[${i}] が空文字になっている`);
        }
      });
    }
  });

  return errors;
}
