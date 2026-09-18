import { NEW_PER_DAY_OPTIONS } from "../lib/scheduler.js";

const STAGE_LABELS = ["1日後", "3日後", "7日後", "14日後", "30日後"];

/**
 * @param {{
 *   dueCount:number, freshCount:number, stageCounts:number[], learnedCount:number,
 *   newPerDay:number, totalQuestions:number, deckTitle:string, deckEmoji:string,
 *   unitLabel:string, subtitle:string, newUnitLabel:string
 * }} props
 */
export function renderHomeScreen({
  dueCount,
  freshCount,
  stageCounts,
  learnedCount,
  newPerDay,
  totalQuestions,
  deckTitle,
  deckEmoji,
  unitLabel,
  subtitle,
  newUnitLabel,
}) {
  const hasWork = dueCount + freshCount > 0;
  const targetCount = dueCount + freshCount;

  const stagesHtml = STAGE_LABELS.map(
    (label, i) => `
      <div class="stage ${stageCounts[i] ? "on" : ""}">
        <b>${stageCounts[i]}</b><span>${label}に復習</span>
      </div>`
  ).join("");

  const newPerDayHtml = NEW_PER_DAY_OPTIONS.map(
    (n) => `
      <button class="btn ${newPerDay === n ? "" : "ghost"} small" style="flex:1"
        data-action="set-new-per-day" data-value="${n}">${n}${newUnitLabel}</button>`
  ).join("");

  return `
    <div class="app-title"><button class="link" style="padding:0; font:inherit; color:inherit; text-decoration:none" data-action="go-menu">◀ メニュー</button></div>
    <div class="hero">
      <p class="greeting">${deckEmoji} ${deckTitle}</p>
      <p class="greeting-sub">${subtitle}</p>
    </div>

    <div class="card">
      <div class="today">
        <div class="today-tile review">
          <span class="num">${dueCount}<small>${unitLabel}</small></span><span class="numlabel">🔁 今日の復習</span>
        </div>
        <div class="today-tile">
          <span class="num">${freshCount}<small>${unitLabel}</small></span><span class="numlabel">✨ はじめての${unitLabel}</span>
        </div>
      </div>
      ${
        hasWork
          ? `<p class="meta" style="margin:10px 0 0">🎯 今日の目安：${targetCount}${unitLabel}</p>
             <button class="btn" style="margin-top:10px" data-action="start">🚀 はじめる</button>`
          : `<div class="empty-state" style="margin-top:14px">
               <span class="emoji">🎉</span>
               <p class="meta" style="margin:0">今日の分は終わったよ！また明日会おうね。</p>
             </div>`
      }
    </div>

    <div class="card">
      <div class="meta">🧠 覚え直しの段階（${learnedCount}/${totalQuestions}${unitLabel}を学習中）</div>
      <div class="stages">${stagesHtml}</div>
      <p class="meta" style="margin:12px 0 0">正解して理由も言えた問題は、右の段階へ進むよ。間違えた問題は最初に戻るよ。</p>
    </div>

    <div class="card">
      <div class="meta" style="margin-bottom:6px">📚 1日に出す新しい${unitLabel}</div>
      <div class="row">${newPerDayHtml}</div>
    </div>

    <div class="foot">
      <button class="link" data-action="go-stats">📊 分野ごとの成績を見る</button>
      <button class="link" data-action="go-graph">📈 これまでの記録を見る</button>
    </div>
  `;
}
