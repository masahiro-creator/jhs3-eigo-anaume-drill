const THEME_KEY = "jhs3-eigo-anaume-theme";

/** 9色の推しカラーテーマ。--accent系とヒーローのグラデーション色をまとめて差し替える。 */
export const THEMES = [
  { id: "coral", label: "サンゴ", accent: "#FF7A59", accent2: "#FF9F6B", sky: "#4D96FF", violet: "#9B6BFF" },
  { id: "sky", label: "そら", accent: "#4D96FF", accent2: "#6FB2FF", sky: "#2FCB9C", violet: "#7A6BFF" },
  { id: "mint", label: "ミント", accent: "#2FCB9C", accent2: "#62E0BB", sky: "#4D96FF", violet: "#5FC9C9" },
  { id: "violet", label: "すみれ", accent: "#9B6BFF", accent2: "#B78CFF", sky: "#6F8CFF", violet: "#D06BFF" },
  { id: "sun", label: "ひまわり", accent: "#FFB648", accent2: "#FFD27A", sky: "#4D96FF", violet: "#FF9F6B" },
  { id: "pink", label: "さくら", accent: "#FF6FA5", accent2: "#FF9CC1", sky: "#9B6BFF", violet: "#FF7A59" },
  { id: "lime", label: "きみどり", accent: "#8BC34A", accent2: "#AEDC7A", sky: "#4D96FF", violet: "#2FCB9C" },
  { id: "teal", label: "ターコイズ", accent: "#26C6DA", accent2: "#6FE0EE", sky: "#4D96FF", violet: "#9B6BFF" },
  { id: "sunset", label: "ゆうやけ", accent: "#FF5A5F", accent2: "#FF8A80", sky: "#FFB648", violet: "#9B6BFF" },
];

/** @returns {string} 現在選択中のテーマID */
export function loadThemeId() {
  try {
    const id = localStorage.getItem(THEME_KEY);
    if (THEMES.some((t) => t.id === id)) return id;
  } catch {
    // 読み込み失敗時は既定に戻す
  }
  return THEMES[0].id;
}

/** @param {string} themeId */
export function saveThemeId(themeId) {
  try {
    localStorage.setItem(THEME_KEY, themeId);
  } catch {
    // 保存に失敗しても続行する
  }
}

/** 選択中テーマの色をCSSカスタムプロパティとして<html>に反映する。 */
export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const root = document.documentElement.style;
  root.setProperty("--accent", theme.accent);
  root.setProperty("--accent-2", theme.accent2);
  root.setProperty("--sky", theme.sky);
  root.setProperty("--violet", theme.violet);
}
