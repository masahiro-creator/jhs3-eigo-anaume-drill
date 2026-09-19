import { escapeHtml } from "../lib/highlight.js";

const GRADE_TABS = [
  { value: "all", label: "すべて" },
  { value: "1", label: "中1" },
  { value: "2", label: "中2" },
  { value: "3", label: "中3" },
];

function statusFor(card) {
  if (!card || card.seen === 0) return { label: "未学習", cls: "" };
  if (card.box >= 3) return { label: "定着", cls: "high" };
  return { label: "学習中", cls: "mid" };
}

/**
 * 単語一覧画面。学年で絞り込み・キーワード検索ができる。
 * @param {{words: import('../data/words.js').WordItem[], progress: import('../lib/scheduler.js').Progress, gradeFilter:string, query:string}} props
 */
export function renderWordListScreen({ words, progress, gradeFilter, query }) {
  const q = query.trim().toLowerCase();
  const filtered = words.filter((w) => {
    if (gradeFilter !== "all" && String(w.grade) !== gradeFilter) return false;
    if (q && !w.word.toLowerCase().includes(q) && !w.meaning.includes(q)) return false;
    return true;
  });

  const tabsHtml = GRADE_TABS.map(
    (t) => `
      <button class="btn ${gradeFilter === t.value ? "" : "ghost"} small" style="flex:1"
        data-action="set-wordlist-grade" data-grade="${t.value}">${t.label}</button>`
  ).join("");

  const MAX_ROWS = 300;
  const rows = filtered.slice(0, MAX_ROWS);
  const rowsHtml = rows.length
    ? rows
        .map((w) => {
          const status = statusFor(progress.cards[w.id]);
          return `
        <tr>
          <td><span class="grade-chip g${w.grade}">中${w.grade}</span></td>
          <td class="en" style="font-size:16px">${escapeHtml(w.word)}</td>
          <td>${escapeHtml(w.meaning)}</td>
          <td class="r">${status.label ? `<span class="stat-emoji">${status.cls === "high" ? "🟢" : status.cls === "mid" ? "🟡" : "⚪"}</span>${status.label}` : ""}</td>
        </tr>`;
        })
        .join("")
    : `<tr><td colspan="4"><p class="meta" style="margin:8px 0">見つかりませんでした。</p></td></tr>`;

  const moreNoticeHtml =
    filtered.length > MAX_ROWS
      ? `<p class="meta" style="margin:10px 0 0">他 ${filtered.length - MAX_ROWS}語あります。検索で絞り込んでね。</p>`
      : "";

  return `
    <div class="app-title"><button class="link" style="padding:0; font:inherit; color:inherit; text-decoration:none" data-action="go-deck" data-deck="words">◀ 単語ドリルに戻る</button></div>
    <h1>📖 単語一覧</h1>
    <p class="sub">全${words.length}語 ／ 表示中 ${filtered.length}語</p>

    <div class="card">
      <div class="row" style="margin-bottom:10px">${tabsHtml}</div>
      <input type="search" id="wordlist-search" placeholder="🔍 単語または意味で検索"
        value="${escapeHtml(query)}"
        style="width:100%; padding:11px 12px; border:2px solid var(--line); border-radius:var(--radius-sm); font:inherit; font-size:15px;" />
    </div>

    <div class="card" style="overflow-x:auto">
      <table>${rowsHtml}</table>
      ${moreNoticeHtml}
    </div>
  `;
}
