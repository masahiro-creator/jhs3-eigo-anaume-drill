import { THEMES } from "../lib/theme.js";
import { escapeHtml } from "../lib/highlight.js";

/**
 * 練習モードを選ぶトップ画面。
 * @param {{
 *   decks: {key:string, title:string, emoji:string, dueCount:number, freshCount:number, unitLabel:string}[],
 *   streakCount:number, cheerMessage:string, themeId:string
 * }} props
 */
export function renderMenuScreen({ decks, streakCount, cheerMessage, themeId }) {
  const cardsHtml = decks
    .map(
      (d) => `
      <button class="card" type="button" style="width:100%; text-align:left; border:none; cursor:pointer"
        data-action="go-deck" data-deck="${d.key}">
        <div class="today">
          <div>
            <div class="app-title" style="margin-bottom:2px">${d.emoji} ${d.title}</div>
            <span class="meta">🔁 復習 ${d.dueCount}${d.unitLabel} ／ ✨ 新規 ${d.freshCount}${d.unitLabel}</span>
          </div>
        </div>
      </button>`
    )
    .join("");

  const themeSwatchesHtml = THEMES.map(
    (t) => `
      <button class="theme-swatch ${t.id === themeId ? "selected" : ""}" type="button"
        style="background:${t.accent}" data-action="set-theme" data-theme="${t.id}"
        aria-label="${escapeHtml(t.label)}" title="${escapeHtml(t.label)}"></button>`
  ).join("");

  return `
    <div class="app-title">✏️ 中学英語ドリル</div>
    <div class="hero">
      <p class="greeting">😊 今日もいっしょに英語をやっつけよう！ ${streakCount > 0 ? `<span class="streak-badge">🔥 ${streakCount}日連続</span>` : ""}</p>
      <p class="greeting-sub">やりたい方を選んでね</p>
    </div>
    <div class="cheer-banner"><span class="emoji">☺️</span><span>${escapeHtml(cheerMessage)}</span></div>
    ${cardsHtml}
    <div class="card">
      <div class="meta" style="margin-bottom:8px">🎨 推しカラー</div>
      <div class="theme-picker">${themeSwatchesHtml}</div>
    </div>
    <div class="foot"><button class="link" data-action="go-graph">📈 これまでの記録を見る</button></div>
  `;
}
