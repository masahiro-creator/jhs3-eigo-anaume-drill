/**
 * @param {{sureCount:number, guessCount:number, missCount:number}} props
 */
export function renderDoneScreen({ sureCount, guessCount, missCount }) {
  const total = sureCount + guessCount + missCount;
  return `
    <h1>今日の分は終わりです</h1>
    <p class="sub">${total}問に答えました。</p>
    <div class="card">
      <table>
        <tr><td>根拠が言えた正解</td><td class="r">${sureCount}</td></tr>
        <tr><td>なんとなく当てた</td><td class="r">${guessCount}</td></tr>
        <tr><td>間違えた</td><td class="r">${missCount}</td></tr>
      </table>
      <p class="meta" style="margin:12px 0 0">「なんとなく当てた」問題は明日もう一度出ます。間違えた問題は最初の段階に戻ります。</p>
    </div>
    <button class="btn" type="button" data-action="go-home">ホームに戻る</button>
  `;
}
