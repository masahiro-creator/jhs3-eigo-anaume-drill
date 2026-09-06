import { escapeHtml } from "../lib/highlight.js";

/**
 * @param {{stats: {category:string, correct:number, seen:number, rate:number}[]}} props
 */
export function renderStatsScreen({ stats }) {
  const rowsHtml = stats.length
    ? `<table>${stats
        .map((s) => {
          const pct = Math.round(s.rate * 100);
          return `
        <tr>
          <td>${escapeHtml(s.category)}<div class="bar"><i style="width:${pct}%"></i></div></td>
          <td class="r">${pct}%<br><span style="font-size:11px">${s.correct}/${s.seen}</span></td>
        </tr>`;
        })
        .join("")}</table>`
    : `<p class="meta" style="margin:0">まだ記録がありません。何問か解くとここに出ます。</p>`;

  return `
    <h1>分野ごとの成績</h1>
    <p class="sub">正答率の低い順。上にあるものから手を入れると効率がいいです。</p>
    <div class="card">${rowsHtml}</div>
    <div class="foot"><button class="link" data-action="go-home">ホームに戻る</button></div>
  `;
}
