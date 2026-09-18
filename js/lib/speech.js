import { AUDIO_MANIFEST } from "../data/audioManifest.js";

let audioEl = null;

// text -> {text, file} の逆引きを一度だけ作る
const manifestByText = new Map();
Object.values(AUDIO_MANIFEST).forEach((entry) => {
  if (entry && entry.text && entry.file) manifestByText.set(entry.text, entry.file);
});

function speakWithWebSpeech(text) {
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

/**
 * 事前生成された高品質音声があればそれを再生し、なければブラウザ内蔵の
 * Web Speech APIにフォールバックする。
 * @param {string} text
 */
export function speak(text) {
  const file = manifestByText.get(text);
  if (!file) {
    speakWithWebSpeech(text);
    return;
  }
  try {
    if (!audioEl) audioEl = new Audio();
    audioEl.src = file;
    audioEl.currentTime = 0;
    audioEl.play().catch(() => speakWithWebSpeech(text));
  } catch {
    speakWithWebSpeech(text);
  }
}
