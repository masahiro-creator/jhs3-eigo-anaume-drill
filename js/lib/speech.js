/**
 * ブラウザ内蔵のWeb Speech APIで英語を読み上げる。
 * 対応していない環境や失敗時は静かに諦める（学習の続行を優先）。
 * @param {string} text
 */
export function speak(text) {
  try {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // 音声再生に失敗しても学習は続けられるようにする
  }
}
