/**
 * 単語データの整合性チェック。UI・保存処理には依存しない純粋関数。
 * @param {import('../data/words.js').WordItem[]} words
 * @returns {string[]} エラーメッセージの配列。問題なければ空配列。
 */
export function validateWords(words) {
  const errors = [];
  const seenIds = new Set();

  words.forEach((w) => {
    if (seenIds.has(w.id)) errors.push(`${w.id}: id が重複している`);
    seenIds.add(w.id);

    if (!/^w[123]_\d{3}$/.test(w.id)) errors.push(`${w.id}: id の形式が不正`);
    if (![1, 2, 3].includes(w.grade)) errors.push(`${w.id}: grade は1〜3である必要がある`);
    if (!w.word) errors.push(`${w.id}: word が空`);
    if (!w.meaning) errors.push(`${w.id}: meaning が空`);
    if (!w.category) errors.push(`${w.id}: category が空`);
    if (!w.example) errors.push(`${w.id}: example が空`);
    else if (!w.example.includes("?") && !/[.!]$/.test(w.example.trim())) {
      errors.push(`${w.id}: example が文として終わっていない`);
    }
    if (!w.exampleMeaning) errors.push(`${w.id}: exampleMeaning が空`);
  });

  return errors;
}
