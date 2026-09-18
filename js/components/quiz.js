import { renderSentenceWithBlank, renderCompletedSentenceWithMarkers, escapeHtml } from "../lib/highlight.js";

/**
 * @param {{question: import('../data/questions.js').Question, index:number, total:number, picked: number|null}} props
 */
export function renderQuizScreen({ question, index, total, picked }) {
  const progressPct = total > 0 ? Math.round((index / total) * 100) : 0;
  const answered = picked !== null;
  const isCorrect = answered && picked === question.answer;

  const choicesHtml = question.choices
    .map((choice, i) => {
      let cls = "choice";
      let reasonHtml = "";
      if (answered) {
        if (i === question.answer) {
          cls += " correct";
        } else if (i === picked) {
          cls += " picked-wrong";
          reasonHtml = `<span class="reason">${escapeHtml(question.wrongReasons[i])}</span>`;
        } else {
          cls += " dim";
          reasonHtml = `<span class="reason">${escapeHtml(question.wrongReasons[i])}</span>`;
        }
      }
      return `
        <button class="${cls}" type="button" data-action="pick" data-index="${i}" ${answered ? "disabled" : ""}>
          <span class="key">${i + 1}</span>${escapeHtml(choice)}${reasonHtml}
        </button>`;
    })
    .join("");

  const fullSentence = question.sentence.replace("___", question.choices[question.answer]);

  const answerBlockHtml = !answered
    ? ""
    : `
    <div class="card answer-block" style="margin-top:14px">
      <p class="verdict ${isCorrect ? "ok" : "ng"}">${isCorrect ? "🎉 正解！" : "💡 不正解"}</p>
      <span class="point">問われているもの：${escapeHtml(question.point)}</span>
      <p class="en" style="margin:0 0 2px">${renderCompletedSentenceWithMarkers(question)} <button class="link" type="button" data-action="speak" data-text="${escapeHtml(fullSentence)}" title="音声を再生">🔊</button></p>
      <p class="jp">${escapeHtml(question.translation)}</p>
      <p style="margin:12px 0 0; font-size:14px">${escapeHtml(question.explanation)}</p>
      <p class="meta clue-label">根拠になる語：${escapeHtml(question.clue)}</p>
    </div>
    ${
      isCorrect
        ? `
      <p class="meta" style="margin:16px 0 8px">この正解、根拠を言えましたか？</p>
      <div class="row">
        <button class="btn mint" type="button" data-action="grade" data-outcome="sure">💪 根拠が言えた</button>
        <button class="btn ghost" type="button" data-action="grade" data-outcome="guess">🤔 なんとなく当てた</button>
      </div>`
        : `<button class="btn" type="button" style="margin-top:16px" data-action="grade" data-outcome="miss">次へ ▶</button>`
    }
  `;

  const gradeChipClass = `g${question.grade}`;

  return `
    <div class="progress"><i style="width:${progressPct}%"></i></div>
    <div class="meta" style="display:flex; justify-content:space-between; align-items:center">
      <span><span class="grade-chip ${gradeChipClass}">中${question.grade}</span>${escapeHtml(question.category)}　${index + 1} / ${total}問</span>
      <button class="link" type="button" data-action="quit-quiz" style="padding:2px">✕ やめる</button>
    </div>
    <div class="card"><p class="en" style="margin:6px 0 4px">${renderSentenceWithBlank(question.sentence)}</p></div>
    <div id="choices">${choicesHtml}</div>
    ${!answered ? `<p class="meta" style="margin-top:14px">💭 選択肢を縦に見て、何が問われているか先に考えてみよう。</p>` : ""}
    ${answerBlockHtml}
  `;
}
