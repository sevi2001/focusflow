
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Settings2,
  Bell,
  BellOff,
  Coffee,
  Flame,
  CheckCircle2,
  X,
  Save,
  SkipForward,
} from "lucide-react";

type Mode = "focus" | "short" | "long";

type TimerSettings = {
  focus: number;
  short: number;
  long: number;
  autoBreaks: boolean;
  autoFocus: boolean;
  notifications: boolean;
};

type StudyStats = {
  date: string;
  completedSessions: number;
  totalMinutes: number;
};

const SETTINGS_KEY = "focusflow_timer_settings";
const STATS_KEY = "focusflow_study_stats";

const defaultSettings: TimerSettings = {
  focus: 25,
  short: 5,
  long: 15,
  autoBreaks: true,
  autoFocus: false,
  notifications: true,
};

function readSettings(): TimerSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return defaultSettings;

    const parsed: Partial<TimerSettings> = JSON.parse(saved);
    const result = { ...defaultSettings };

    for (const key of ["focus", "short", "long"] as const) {
      const value = parsed[key];
      if (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 180
      ) {
        result[key] = value;
      }
    }

    for (const key of [
      "autoBreaks",
      "autoFocus",
      "notifications",
    ] as const) {
      if (typeof parsed[key] === "boolean") {
        result[key] = parsed[key];
      }
    }

    return result;
  } catch {
    return defaultSettings;
  }
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readStats(): StudyStats {
  const today = localDateKey();

  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) {
      return { date: today, completedSessions: 0, totalMinutes: 0 };
    }

    const parsed: StudyStats = JSON.parse(saved);

    if (
      parsed.date === today &&
      Number.isFinite(parsed.completedSessions) &&
      Number.isFinite(parsed.totalMinutes)
    ) {
      return {
        date: today,
        completedSessions: Math.max(0, parsed.completedSessions),
        totalMinutes: Math.max(0, parsed.totalMinutes),
      };
    }
  } catch {
    // Use empty daily stats.
  }

  return { date: today, completedSessions: 0, totalMinutes: 0 };
}

function getNextMode(
  currentMode: Mode,
  completedFocusSessions: number
): Mode {
  if (currentMode !== "focus") return "focus";

  return completedFocusSessions % 4 === 0
    ? "long"
    : "short";
}

export default function PomodoroTimer() {
  const [settings, setSettings] = useState(readSettings);
  const [draftSettings, setDraftSettings] = useState(readSettings);
  const [stats, setStats] = useState(readStats);

  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(
    () => readSettings().focus * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [notificationPermission, setNotificationPermission] =
    useState(
      typeof Notification !== "undefined"
        ? Notification.permission
        : "unsupported"
    );

  const deadlineRef = useRef<number | null>(null);
  const lastCompletedRef = useRef(false);
  const modeRef = useRef(mode);
  const settingsRef = useRef(settings);
  const statsRef = useRef(stats);

  modeRef.current = mode;
  settingsRef.current = settings;
  statsRef.current = stats;

  const showNotification = useCallback(
    (title: string, body: string) => {
      if (!settingsRef.current.notifications) return;

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      }
    },
    []
  );

  const finishSession = useCallback(() => {
    if (lastCompletedRef.current) return;
    lastCompletedRef.current = true;

    const currentMode = modeRef.current;
    const currentSettings = settingsRef.current;

    let completed = statsRef.current.completedSessions;

    if (currentMode === "focus") {
      const today = localDateKey();
      const previous = statsRef.current;

      const nextStats: StudyStats = {
        date: today,
        completedSessions:
          (previous.date === today
            ? previous.completedSessions
            : 0) + 1,
        totalMinutes:
          (previous.date === today
            ? previous.totalMinutes
            : 0) + currentSettings.focus,
      };

      completed = nextStats.completedSessions;
      statsRef.current = nextStats;
      setStats(nextStats);

      setMessage("Amazing work! Focus session completed. 🎉");
      showNotification(
        "Focus session complete! 🎉",
        "Great work! It's time for a relaxing break."
      );
    } else {
      setMessage("Break finished! Ready to focus again? ☕");
      showNotification(
        "Break finished! ☕",
        "Your next focus session is ready."
      );
    }

    const nextMode = getNextMode(currentMode, completed);
    const shouldAutoStart =
      currentMode === "focus"
        ? currentSettings.autoBreaks
        : currentSettings.autoFocus;

    modeRef.current = nextMode;
    setMode(nextMode);
    setTimeLeft(currentSettings[nextMode] * 60);

    deadlineRef.current = null;
    setIsRunning(shouldAutoStart);
  }, [showNotification]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (!isRunning) return;

    lastCompletedRef.current = false;

    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = window.setInterval(() => {
      if (deadlineRef.current === null) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(interval);
        finishSession();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRunning, finishSession, mode]);

  const changeMode = (newMode: Mode) => {
    setIsRunning(false);
    deadlineRef.current = null;
    lastCompletedRef.current = false;
    modeRef.current = newMode;
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
    setMessage("");
  };

  const toggleTimer = () => {
    if (isRunning) {
      if (deadlineRef.current !== null) {
        setTimeLeft(
          Math.max(
            0,
            Math.ceil((deadlineRef.current - Date.now()) / 1000)
          )
        );
      }
      deadlineRef.current = null;
      setIsRunning(false);
    } else {
      lastCompletedRef.current = false;
      deadlineRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
      setMessage("");
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    deadlineRef.current = null;
    lastCompletedRef.current = false;
    setTimeLeft(settings[mode] * 60);
    setMessage("");
  };

  const skipSession = () => {
    setIsRunning(false);
    deadlineRef.current = null;
    lastCompletedRef.current = false;

    const next = getNextMode(
      mode,
      stats.completedSessions + (mode === "focus" ? 1 : 0)
    );

    modeRef.current = next;
    setMode(next);
    setTimeLeft(settings[next] * 60);
    setMessage("Session skipped. Ready for the next one?");
  };

  const saveSettings = () => {
    const sanitized: TimerSettings = {
      ...draftSettings,
      focus: Math.min(180, Math.max(1, Math.round(draftSettings.focus || 1))),
      short: Math.min(180, Math.max(1, Math.round(draftSettings.short || 1))),
      long: Math.min(180, Math.max(1, Math.round(draftSettings.long || 1))),
    };

    settingsRef.current = sanitized;
    setSettings(sanitized);
    setIsRunning(false);
    deadlineRef.current = null;
    setTimeLeft(sanitized[mode] * 60);
    setShowSettings(false);
    setMessage("Timer settings saved successfully! ✨");
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setNotificationPermission(Notification.permission);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const duration = settings[mode] * 60;
  const progress = Math.min(
    100,
    Math.max(0, ((duration - timeLeft) / duration) * 100)
  );

  const circumference = 2 * Math.PI * 98;

  const modeLabels: Record<Mode, string> = {
    focus: "Focus",
    short: "Short Break",
    long: "Long Break",
  };

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-[#151a30]/90 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-200">
          <Timer size={20} />
          <h2 className="text-lg font-semibold">Focus Timer</h2>
        </div>

        <button
          onClick={() => {
            setDraftSettings(settings);
            setShowSettings(true);
          }}
          aria-label="Timer settings"
          className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-amber-200"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* Mode selection */}
      <div className="mb-7 flex flex-wrap justify-center gap-2">
        {(["focus", "short", "long"] as Mode[]).map((item) => (
          <button
            key={item}
            onClick={() => changeMode(item)}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              mode === item
                ? "bg-amber-300 text-slate-900"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {modeLabels[item]}
          </button>
        ))}
      </div>

      {/* Animated circular timer */}
      <div className="relative mx-auto mb-7 flex h-56 w-56 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 224 224"
        >
          <circle
            cx="112"
            cy="112"
            r="98"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="9"
          />
          <motion.circle
            cx="112"
            cy="112"
            r="98"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset:
                circumference * (1 - progress / 100),
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        <div>
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold tracking-wider"
          >
            {formattedTime}
          </motion.div>

          <p className="mt-3 text-sm text-slate-400">
            {mode === "focus"
              ? "Time to concentrate ✨"
              : "Enjoy your break ☕"}
          </p>

          {isRunning && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-3 text-xs text-emerald-300"
            >
              ● Timer running
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="flex items-center gap-2 rounded-full bg-amber-300 px-7 py-3 font-semibold text-slate-900 transition hover:bg-amber-200"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pause" : "Start"}
        </motion.button>

        <button
          onClick={resetTimer}
          title="Reset timer"
          aria-label="Reset timer"
          className="rounded-full border border-white/20 p-3 transition hover:bg-white/10"
        >
          <RotateCcw size={19} />
        </button>

        <button
          onClick={skipSession}
          title="Skip session"
          aria-label="Skip session"
          className="rounded-full border border-white/20 p-3 transition hover:bg-white/10"
        >
          <SkipForward size={19} />
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="mt-5 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-200"
        >
          {message}
        </motion.p>
      )}

      {/* Statistics */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Flame className="mx-auto mb-2 text-orange-300" size={22} />
          <p className="text-2xl font-bold">
            {stats.date === localDateKey()
              ? stats.completedSessions
              : 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Sessions Today
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <CheckCircle2
            className="mx-auto mb-2 text-emerald-300"
            size={22}
          />
          <p className="text-2xl font-bold">
            {stats.date === localDateKey()
              ? stats.totalMinutes
              : 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Focus Minutes
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-slate-400">
        {settings.autoBreaks
          ? "☕ Automatic breaks enabled"
          : "☕ Manual breaks enabled"}
      </p>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            role="dialog"
            aria-modal="true"
            aria-label="Pomodoro timer settings"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-[#20263e] p-6 text-left shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <Settings2 size={21} className="text-amber-300" />
                Timer Settings
              </h3>

              <button
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-5 text-sm text-slate-400">
              Customize your perfect study routine.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {(["focus", "short", "long"] as Mode[]).map((item) => (
                <label key={item} className="block">
                  <span className="mb-2 block text-xs text-slate-300">
                    {modeLabels[item]}
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={draftSettings[item]}
                    onChange={(event) =>
                      setDraftSettings((previous) => ({
                        ...previous,
                        [item]: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center text-white outline-none focus:border-amber-300"
                  />
                </label>
              ))}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Duration in minutes (1–180).
            </p>

            <div className="mt-7 space-y-4">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  Automatically start breaks
                </span>
                <input
                  type="checkbox"
                  checked={draftSettings.autoBreaks}
                  onChange={(event) =>
                    setDraftSettings((previous) => ({
                      ...previous,
                      autoBreaks: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-amber-300"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">
                  Automatically start focus sessions
                </span>
                <input
                  type="checkbox"
                  checked={draftSettings.autoFocus}
                  onChange={(event) =>
                    setDraftSettings((previous) => ({
                      ...previous,
                      autoFocus: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-amber-300"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm">
                  {draftSettings.notifications ? (
                    <Bell size={17} />
                  ) : (
                    <BellOff size={17} />
                  )}
                  Desktop notifications
                </span>
                <input
                  type="checkbox"
                  checked={draftSettings.notifications}
                  onChange={(event) =>
                    setDraftSettings((previous) => ({
                      ...previous,
                      notifications: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-amber-300"
                />
              </label>
            </div>

            {draftSettings.notifications && (
              <div className="mt-5 rounded-xl bg-white/5 p-3">
                <p className="mb-2 text-xs text-slate-400">
                  Notification permission: {notificationPermission}
                </p>

                {notificationPermission === "default" && (
                  <button
                    onClick={requestNotifications}
                    className="flex items-center gap-2 text-sm text-amber-200 hover:underline"
                  >
                    <Bell size={16} />
                    Enable browser notifications
                  </button>
                )}
              </div>
            )}

            <button
              onClick={saveSettings}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-amber-300 py-3 font-semibold text-slate-900 transition hover:bg-amber-200"
            >
              <Save size={18} />
              Save Settings
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
