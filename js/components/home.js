import { NEW_PER_DAY_OPTIONS } from "../lib/scheduler.js";

const STAGE_LABELS = ["1日後", "3日後", "7日後", "14日後", "30日後"];

/**
 * @param {{dueCount:number, freshCount:number, stageCounts:number[], learnedCount:number, newPerDay:number, totalQuestions:number}} props
 */
export function renderHomeScreen({ dueCount, freshCount, stageCounts, learnedCount, newPerDay, totalQuestions }) {
  const hasWork = dueCount + freshCount > 0;

  const stagesHtml = STAGE_LABELS.map(
    (label, i) => `
      <div class="stage ${stageCounts[i] ? "on" : ""}">
        <b>${stageCounts[i]}</b><span>${label}に復習</span>
      </div>`
  ).join("");

  const newPerDayHtml = NEW_PER_DAY_OPTIONS.map(
    (n) => `
      <button class="btn ${newPerDay === n ? "" : "ghost"} small" style="flex:1"
        data-action="set-new-per-day" data-value="${n}">${n}問</button>`
  ).join("");

  return `
    <div class="app-title">✏️ 空所補充ドリル</div>
    <div class="hero">
      <p class="greeting">😊 今日もいっしょに英語をやっつけよう！</p>
      <p class="greeting-sub">中1〜中3の文法 ${totalQuestions}問 ／ 忘れかけた頃にまた出てくる仕組みだよ</p>
    </div>

    <div class="card">
      <div class="today">
        <div class="today-tile review">
          <span class="num">${dueCount}<small>問</small></span><span class="numlabel">🔁 今日の復習</span>
        </div>
        <div class="today-tile">
          <span class="num">${freshCount}<small>問</small></span><span class="numlabel">✨ はじめての問題</span>
        </div>
      </div>
      ${
        hasWork
          ? `<button class="btn" style="margin-top:14px" data-action="start">🚀 はじめる</button>`
          : `<div class="empty-state" style="margin-top:14px">
               <span class="emoji">🎉</span>
               <p class="meta" style="margin:0">今日の分は終わったよ！また明日会おうね。</p>
             </div>`
      }
    </div>

    <div class="card">
      <div class="meta">🧠 覚え直しの段階（${learnedCount}問を学習中）</div>
      <div class="stages">${stagesHtml}</div>
      <p class="meta" style="margin:12px 0 0">正解して理由も言えた問題は、右の段階へ進むよ。間違えた問題は最初に戻るよ。</p>
    </div>

    <div class="card">
      <div class="meta" style="margin-bottom:6px">📚 1日に出す新しい問題</div>
      <div class="row">${newPerDayHtml}</div>
    </div>

    <div class="foot"><button class="link" data-action="go-stats">📊 分野ごとの成績を見る</button></div>
  `;
}
