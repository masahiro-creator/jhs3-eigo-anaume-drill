import { QUESTIONS } from "./data/questions.js";
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
} from "./lib/scheduler.js";
import { loadProgress, saveProgress } from "./lib/storage.js";
import { renderHomeScreen } from "./components/home.js";
import { renderQuizScreen } from "./components/quiz.js";
import { renderStatsScreen } from "./components/stats.js";
import { renderDoneScreen } from "./components/done.js";

const app = document.getElementById("app");

let progress = loadProgress();
let screen = "home";
let session = [];
let idx = 0;
let picked = null;
let runStats = { sure: 0, guess: 0, miss: 0 };

function render() {
  if (screen === "home") {
    const today = todayString();
    app.innerHTML = renderHomeScreen({
      dueCount: getDueQuestions(QUESTIONS, progress, today).length,
      freshCount: Math.min(getUnseenQuestions(QUESTIONS, progress).length, countRemainingNewSlots(progress)),
      stageCounts: computeStageCounts(progress),
      learnedCount: Object.keys(progress.cards).length,
      newPerDay: progress.newPerDay,
      totalQuestions: QUESTIONS.length,
    });
  } else if (screen === "quiz") {
    const question = session[idx];
    app.innerHTML = renderQuizScreen({ question, index: idx, total: session.length, picked });
    if (picked !== null) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  } else if (screen === "stats") {
    app.innerHTML = renderStatsScreen({ stats: computeCategoryStats(QUESTIONS, progress) });
  } else if (screen === "done") {
    app.innerHTML = renderDoneScreen({
      sureCount: runStats.sure,
      guessCount: runStats.guess,
      missCount: runStats.miss,
    });
  }
}

function startSession() {
  const today = todayString();
  progress = resetDailyCountIfNeeded(progress, today);
  session = buildSession(QUESTIONS, progress, today);
  if (session.length === 0) {
    screen = "home";
    render();
    return;
  }
  idx = 0;
  picked = null;
  runStats = { sure: 0, guess: 0, miss: 0 };
  screen = "quiz";
  render();
}

function pickChoice(index) {
  if (picked !== null) return;
  picked = index;
  render();
}

function gradeAnswer(outcome) {
  const today = todayString();
  const question = session[idx];
  progress = applyAnswer(progress, question.id, outcome, today);
  saveProgress(progress);
  runStats[outcome]++;
  session = requeueOnMiss(session, idx, outcome);

  idx++;
  picked = null;
  screen = idx >= session.length ? "done" : "quiz";
  render();
}

function setNewPerDay(value) {
  progress = { ...progress, newPerDay: value };
  saveProgress(progress);
  render();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "start") startSession();
  else if (action === "set-new-per-day") setNewPerDay(Number(target.dataset.value));
  else if (action === "go-stats") {
    screen = "stats";
    render();
  } else if (action === "go-home") {
    screen = "home";
    render();
  } else if (action === "pick") pickChoice(Number(target.dataset.index));
  else if (action === "grade") gradeAnswer(target.dataset.outcome);
});

document.addEventListener("keydown", (event) => {
  if (screen !== "quiz" || picked !== null) return;
  if (/^[1-4]$/.test(event.key)) {
    pickChoice(Number(event.key) - 1);
  }
});

render();
