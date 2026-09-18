import { QUESTIONS } from "./data/questions.js";
import { WORDS } from "./data/words.js";
import {
  todayString,
  resetDailyCountIfNeeded,
  buildSession,
  requeueOnMiss,
  applyAnswer,
  getDueQuestions,
  getUnseenQuestions,
  countRemainingNewSlots,
  computeStageCounts,
  computeCategoryStats,
  computeMasteredCount,
  getWeakItems,
  shuffleArray,
} from "./lib/scheduler.js";
import { loadProgress, saveProgress, STORAGE_KEYS } from "./lib/storage.js";
import { loadHistory, saveHistory, recordAnswer } from "./lib/historyLog.js";
import { pickDistractors } from "./lib/distractors.js";
import { speak, loadPlaybackRate, savePlaybackRate } from "./lib/speech.js";
import { loadStreak, saveStreak, updateStreak } from "./lib/streak.js";
import { loadThemeId, saveThemeId, applyTheme } from "./lib/theme.js";
import { triggerConfetti } from "./lib/confetti.js";
import { pickCheerMessage } from "./data/cheerMessages.js";
import { renderMenuScreen } from "./components/menu.js";
import { renderHomeScreen } from "./components/home.js";
import { renderQuizScreen } from "./components/quiz.js";
import { renderVocabQuizScreen } from "./components/vocabQuiz.js";
import { renderStatsScreen } from "./components/stats.js";
import { renderDoneScreen } from "./components/done.js";
import { renderGraphScreen } from "./components/graph.js";

const app = document.getElementById("app");

const DECKS = {
  grammar: {
    items: QUESTIONS,
    storageKey: STORAGE_KEYS.grammar,
    title: "空所補充ドリル",
    emoji: "✏️",
    unitLabel: "問",
    newUnitLabel: "問",
    subtitle: (n) => `中1〜中3の文法 ${n}問 ／ 忘れかけた頃にまた出てくる仕組みだよ`,
  },
  words: {
    items: WORDS,
    storageKey: STORAGE_KEYS.words,
    title: "単語ドリル",
    emoji: "📚",
    unitLabel: "語",
    newUnitLabel: "語",
    subtitle: (n) => `中1〜中3の単語 ${n}語 ／ 忘れかけた頃にまた出てくる仕組みだよ`,
  },
};

let progressByDeck = {
  grammar: loadProgress(DECKS.grammar.storageKey),
  words: loadProgress(DECKS.words.storageKey),
};
let history = loadHistory();
let streak = loadStreak();
let themeId = loadThemeId();
applyTheme(themeId);
let playbackRate = loadPlaybackRate();

let mode = "grammar";
let screen = "menu";
let session = [];
let idx = 0;
let picked = null;
let runStats = { sure: 0, guess: 0, miss: 0 };
let currentChoices = [];
let currentCorrectIndex = -1;
let isWeakSession = false;

function currentDeck() {
  return DECKS[mode];
}

function currentProgress() {
  return progressByDeck[mode];
}

function deckDueFresh(deckKey) {
  const deck = DECKS[deckKey];
  const progress = progressByDeck[deckKey];
  const today = todayString();
  return {
    dueCount: getDueQuestions(deck.items, progress, today).length,
    freshCount: Math.min(getUnseenQuestions(deck.items, progress).length, countRemainingNewSlots(progress)),
  };
}

function prepareVocabChoices() {
  const word = session[idx];
  const distractors = pickDistractors(WORDS, word, 3);
  const choices = shuffleArray([word.meaning, ...distractors.map((d) => d.meaning)]);
  currentChoices = choices;
  currentCorrectIndex = choices.indexOf(word.meaning);
}

function render() {
  if (screen === "menu") {
    app.innerHTML = renderMenuScreen({
      decks: Object.entries(DECKS).map(([key, deck]) => ({
        key,
        title: deck.title,
        emoji: deck.emoji,
        unitLabel: deck.unitLabel,
        ...deckDueFresh(key),
      })),
      streakCount: streak.count,
      cheerMessage: pickCheerMessage(todayString()),
      themeId,
      playbackRate,
    });
  } else if (screen === "home") {
    const deck = currentDeck();
    const progress = currentProgress();
    const { dueCount, freshCount } = deckDueFresh(mode);
    app.innerHTML = renderHomeScreen({
      dueCount,
      freshCount,
      stageCounts: computeStageCounts(progress),
      learnedCount: Object.keys(progress.cards).length,
      newPerDay: progress.newPerDay,
      totalQuestions: deck.items.length,
      deckTitle: deck.title,
      deckEmoji: deck.emoji,
      unitLabel: deck.unitLabel,
      newUnitLabel: deck.newUnitLabel,
      subtitle: deck.subtitle(deck.items.length),
      weakCount: getWeakItems(deck.items, progress).length,
    });
  } else if (screen === "quiz") {
    if (mode === "grammar") {
      const question = session[idx];
      app.innerHTML = renderQuizScreen({ question, index: idx, total: session.length, picked });
    } else {
      const word = session[idx];
      app.innerHTML = renderVocabQuizScreen({
        word,
        index: idx,
        total: session.length,
        picked,
        choices: currentChoices,
        correctIndex: currentCorrectIndex,
      });
    }
    if (picked !== null) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  } else if (screen === "stats") {
    app.innerHTML = renderStatsScreen({ stats: computeCategoryStats(currentDeck().items, currentProgress()) });
  } else if (screen === "done") {
    app.innerHTML = renderDoneScreen({
      sureCount: runStats.sure,
      guessCount: runStats.guess,
      missCount: runStats.miss,
    });
  } else if (screen === "graph") {
    app.innerHTML = renderGraphScreen({ history });
  }
}

function goMenu() {
  screen = "menu";
  render();
}

function goDeck(deckKey) {
  mode = deckKey;
  screen = "home";
  render();
}

function goGraph() {
  screen = "graph";
  render();
}

function beginQuiz(items) {
  if (items.length === 0) {
    screen = "home";
    render();
    return;
  }
  session = items;
  idx = 0;
  picked = null;
  runStats = { sure: 0, guess: 0, miss: 0 };
  if (mode === "words") prepareVocabChoices();
  screen = "quiz";
  render();
}

function startSession() {
  const today = todayString();
  progressByDeck[mode] = resetDailyCountIfNeeded(currentProgress(), today);
  isWeakSession = false;
  beginQuiz(buildSession(currentDeck().items, currentProgress(), today));
}

function startWeakSession() {
  isWeakSession = true;
  beginQuiz(shuffleArray(getWeakItems(currentDeck().items, currentProgress())));
}

function pickChoice(index) {
  if (picked !== null) return;
  picked = index;
  render();

  const item = session[idx];
  if (mode === "grammar") {
    speak(item.sentence.replace("___", item.choices[item.answer]));
  } else {
    speak(item.word);
  }
}

function quitQuiz() {
  session = [];
  idx = 0;
  picked = null;
  screen = "home";
  render();
}

function gradeAnswer(outcome) {
  const today = todayString();
  const item = session[idx];
  progressByDeck[mode] = applyAnswer(currentProgress(), item.id, outcome, today);
  saveProgress(currentDeck().storageKey, currentProgress());

  const masteredTotal = computeMasteredCount(progressByDeck.grammar) + computeMasteredCount(progressByDeck.words);
  history = recordAnswer(history, today, masteredTotal);
  saveHistory(history);

  streak = updateStreak(streak, today);
  saveStreak(streak);

  if (outcome !== "miss") triggerConfetti();

  runStats[outcome]++;
  if (!isWeakSession) session = requeueOnMiss(session, idx, outcome);

  idx++;
  picked = null;
  if (idx >= session.length) {
    screen = "done";
  } else {
    if (mode === "words") prepareVocabChoices();
  }
  render();
}

function setNewPerDay(value) {
  progressByDeck[mode] = { ...currentProgress(), newPerDay: value };
  saveProgress(currentDeck().storageKey, currentProgress());
  render();
}

function setTheme(id) {
  themeId = id;
  saveThemeId(themeId);
  applyTheme(themeId);
  render();
}

function setRate(rate) {
  playbackRate = rate;
  savePlaybackRate(playbackRate);
  render();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "start") startSession();
  else if (action === "start-weak") startWeakSession();
  else if (action === "set-new-per-day") setNewPerDay(Number(target.dataset.value));
  else if (action === "set-theme") setTheme(target.dataset.theme);
  else if (action === "set-rate") setRate(Number(target.dataset.rate));
  else if (action === "quit-quiz") quitQuiz();
  else if (action === "go-stats") {
    screen = "stats";
    render();
  } else if (action === "go-home") {
    screen = "home";
    render();
  } else if (action === "go-menu") goMenu();
  else if (action === "go-deck") goDeck(target.dataset.deck);
  else if (action === "go-graph") goGraph();
  else if (action === "pick") pickChoice(Number(target.dataset.index));
  else if (action === "grade") gradeAnswer(target.dataset.outcome);
  else if (action === "speak") speak(target.dataset.text);
});

document.addEventListener("keydown", (event) => {
  if (screen !== "quiz" || picked !== null) return;
  if (/^[1-4]$/.test(event.key)) {
    pickChoice(Number(event.key) - 1);
  }
});

render();
