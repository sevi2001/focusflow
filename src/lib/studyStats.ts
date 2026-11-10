
export type StudyDay = {
  date: string;
  sessions: number;
  minutes: number;
};

export type StudyHistory = {
  days: StudyDay[];
  dailyGoal: number;
};

export const STUDY_HISTORY_KEY = "focusflow_study_history";
export const STUDY_HISTORY_EVENT = "focusflow:study-updated";

const LEGACY_STATS_KEY = "focusflow_study_stats";

const DEFAULT_GOAL = 120;

export function getLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getLastSevenDays(): string[] {
  const dates: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    dates.push(getLocalDate(date));
  }

  return dates;
}

function isStudyDay(value: unknown): value is StudyDay {
  if (!value || typeof value !== "object") return false;

  const day = value as Partial<StudyDay>;

  return (
    typeof day.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    typeof day.sessions === "number" &&
    Number.isFinite(day.sessions) &&
    day.sessions >= 0 &&
    typeof day.minutes === "number" &&
    Number.isFinite(day.minutes) &&
    day.minutes >= 0
  );
}

function normalizeHistory(value: unknown): StudyHistory {
  const fallback: StudyHistory = {
    days: [],
    dailyGoal: DEFAULT_GOAL,
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const parsed = value as Partial<StudyHistory>;

  return {
    days: Array.isArray(parsed.days)
      ? parsed.days.filter(isStudyDay)
      : [],
    dailyGoal:
      typeof parsed.dailyGoal === "number" &&
      Number.isInteger(parsed.dailyGoal) &&
      parsed.dailyGoal >= 1 &&
      parsed.dailyGoal <= 1440
        ? parsed.dailyGoal
        : DEFAULT_GOAL,
  };
}

export function getStudyHistory(): StudyHistory {
  if (typeof window === "undefined") {
    return { days: [], dailyGoal: DEFAULT_GOAL };
  }

  try {
    const stored = localStorage.getItem(STUDY_HISTORY_KEY);

    if (stored) {
      return normalizeHistory(JSON.parse(stored));
    }

    // Import previously completed Step 4 sessions.
    const legacy = localStorage.getItem(LEGACY_STATS_KEY);

    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<{
        date: string;
        completedSessions: number;
        totalMinutes: number;
      }>;

      if (
        typeof parsed.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) &&
        typeof parsed.completedSessions === "number" &&
        Number.isFinite(parsed.completedSessions) &&
        parsed.completedSessions >= 0 &&
        typeof parsed.totalMinutes === "number" &&
        Number.isFinite(parsed.totalMinutes) &&
        parsed.totalMinutes >= 0
      ) {
        return {
          days: [
            {
              date: parsed.date,
              sessions: parsed.completedSessions,
              minutes: parsed.totalMinutes,
            },
          ],
          dailyGoal: DEFAULT_GOAL,
        };
      }
    }
  } catch {
    // Return empty history if storage is unavailable.
  }

  return { days: [], dailyGoal: DEFAULT_GOAL };
}

function saveStudyHistory(history: StudyHistory) {
  localStorage.setItem(
    STUDY_HISTORY_KEY,
    JSON.stringify(history)
  );

  window.dispatchEvent(new Event(STUDY_HISTORY_EVENT));
}

export function recordFocusSession(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return;

  const today = getLocalDate();
  const history = getStudyHistory();

  const existing = history.days.find(
    (day) => day.date === today
  );

  const updatedDay: StudyDay = {
    date: today,
    sessions: (existing?.sessions ?? 0) + 1,
    minutes: (existing?.minutes ?? 0) + minutes,
  };

  const updatedDays = history.days.filter(
    (day) => day.date !== today
  );

  updatedDays.push(updatedDay);
  updatedDays.sort((a, b) => a.date.localeCompare(b.date));

  saveStudyHistory({
    ...history,
    days: updatedDays,
  });
}

export function updateDailyGoal(minutes: number) {
  const goal = Math.min(
    1440,
    Math.max(1, Math.round(minutes))
  );

  saveStudyHistory({
    ...getStudyHistory(),
    dailyGoal: goal,
  });
}

export function subscribeToStudyHistory(
  callback: () => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === STUDY_HISTORY_KEY ||
      event.key === LEGACY_STATS_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(
    STUDY_HISTORY_EVENT,
    callback
  );
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(
      STUDY_HISTORY_EVENT,
      callback
    );
    window.removeEventListener("storage", handleStorage);
  };
}

export function calculateStreak(days: StudyDay[]): number {
  const studied = new Set(
    days.filter((day) => day.minutes > 0).map((day) => day.date)
  );

  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // An active streak may continue from yesterday.
  if (!studied.has(getLocalDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (studied.has(getLocalDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
