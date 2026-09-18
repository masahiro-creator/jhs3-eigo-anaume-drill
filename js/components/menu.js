/**
 * 練習モードを選ぶトップ画面。
 * @param {{decks: {key:string, title:string, emoji:string, dueCount:number, freshCount:number, unitLabel:string}[]}} props
 */
export function renderMenuScreen({ decks }) {
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

  return `
    <div class="app-title">✏️ 中学英語ドリル</div>
    <div class="hero">
      <p class="greeting">😊 今日もいっしょに英語をやっつけよう！</p>
      <p class="greeting-sub">やりたい方を選んでね</p>
    </div>
    ${cardsHtml}
    <div class="foot"><button class="link" data-action="go-graph">📈 これまでの記録を見る</button></div>
  `;
}
