import { addDaysToDateString } from "./scheduler.js";

const STREAK_KEY = "jhs3-eigo-anaume-streak";

/** @typedef {{lastActiveDate: string, count: number}} StreakState */

/** @returns {StreakState} */
export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { lastActiveDate: "", count: 0 };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lastActiveDate === "string" && Number.isFinite(parsed?.count)) {
      return parsed;
    }
  } catch {
    // 壊れていても初期状態で続行する
  }
  return { lastActiveDate: "", count: 0 };
}

/** @param {StreakState} streak */
export function saveStreak(streak) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    // 保存に失敗しても続行する
  }
}

/**
 * 今日、1問でも取り組んだときに呼ぶ。連続日数を更新して返す。
 * 同じ日に何度呼んでもカウントは変わらない。
 * @param {StreakState} streak
 * @param {string} today
 * @returns {StreakState}
 */
export function updateStreak(streak, today) {
  if (streak.lastActiveDate === today) return streak;
  const yesterday = addDaysToDateString(today, -1);
  const nextCount = streak.lastActiveDate === yesterday ? streak.count + 1 : 1;
  return { lastActiveDate: today, count: nextCount };
}
