const COLORS = ["#FF7A59", "#FFB648", "#2FCB9C", "#4D96FF", "#9B6BFF"];

/**
 * 画面上に紙吹雪を一度だけ散らす。外部ライブラリなし、CSSアニメーション任せ。
 * prefers-reduced-motion を尊重して何もしない。
 */
export function triggerConfetti() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);

    const pieceCount = 28;
    for (let i = 0; i < pieceCount; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      piece.style.animationDuration = `${0.9 + Math.random() * 0.6}s`;
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 120}px`);
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 1800);
  } catch {
    // 紙吹雪が失敗しても学習は続けられるようにする
  }
}
