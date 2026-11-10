
import { useCallback, useEffect, useRef, useState } from "react";
import { recordFocusSession } from "../lib/studyStats";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import "./PomodoroTimer.css";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Sparkles,
  Moon,
  Coffee,
  Settings2,
  Bell,
  BellOff,
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
  const reducedMotion = useReducedMotion();
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

// Save this completed focus session to the dashboard history.
recordFocusSession(currentSettings.focus);

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


  const modeLabels: Record<Mode, string> = {
    focus: "Focus",
    short: "Short Break",
    long: "Long Break",
  };

  const modeMessages: Record<Mode, string> = {
    focus: "Breathe in. Find your flow.",
    short: "A gentle moment to recharge.",
    long: "Rest well. You've earned it.",
  };

  const ModeIcon = mode === "focus" ? Sparkles : mode === "short" ? Coffee : Moon;
  const todayStats = stats.date === localDateKey()
    ? stats
    : { completedSessions: 0, totalMinutes: 0 };

  return (
    <section className={`ff-timer ff-timer--${mode}`} aria-label="Pomodoro timer">
      <div className="ff-timer__glow" aria-hidden="true" />
      <div className="ff-timer__header">
        <div className="ff-timer__heading">
          <span className="ff-timer__heading-icon"><Timer size={19} /></span>
          <div>
            <h2>Focus Timer</h2>
            <p>Your little pocket of calm</p>
          </div>
        </div>
        <button type="button" className="ff-timer__icon-button" aria-label="Timer settings"
          onClick={() => { setDraftSettings(settings); setShowSettings(true); }}>
          <Settings2 size={19} />
        </button>
      </div>

      <div className="ff-timer__modes" role="group" aria-label="Timer mode">
        {(["focus", "short", "long"] as Mode[]).map((item) => (
          <button type="button" key={item} onClick={() => changeMode(item)}
            aria-pressed={mode === item}
            className={`ff-timer__mode ${mode === item ? "is-active" : ""}`}>
            {modeLabels[item]}
          </button>
        ))}
      </div>

      <div className="ff-timer__dial-wrap">
        <div className={`ff-timer__dial ${isRunning ? "is-running" : ""}`}>
          <div className="ff-timer__dial-halo" aria-hidden="true" />
          <svg className="ff-timer__ring" viewBox="0 0 240 240" aria-hidden="true">
            <defs>
              <linearGradient id="ff-timer-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--ff-ring-start)" />
                <stop offset="100%" stopColor="var(--ff-ring-end)" />
              </linearGradient>
            </defs>
            <circle cx="120" cy="120" r="104" className="ff-timer__ring-track" />
            <motion.circle cx="120" cy="120" r="104"
              className="ff-timer__ring-progress"
              stroke="url(#ff-timer-ring-gradient)"
              strokeDasharray={2 * Math.PI * 104}
              animate={{ strokeDashoffset: (2 * Math.PI * 104) * (1 - progress / 100) }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            />
          </svg>
          <div className="ff-timer__dial-content">
            <span className="ff-timer__dial-label"><ModeIcon size={14} /> {modeLabels[mode].toUpperCase()}</span>
            <motion.div key={mode} className="ff-timer__time"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
              role="timer" aria-label={`${minutes} minutes ${seconds} seconds remaining`}>
              {formattedTime}
            </motion.div>
            <span className="ff-timer__dial-subtitle">{modeMessages[mode]}</span>
            <span className={`ff-timer__status ${isRunning ? "is-running" : ""}`}>
              <span className="ff-timer__status-dot" />
              {isRunning ? "Timer running" : timeLeft < duration ? "Paused" : "Ready when you are"}
            </span>
          </div>
        </div>
      </div>

      <div className="ff-timer__progress-caption">
        <span>{Math.round(progress)}% complete</span>
        <span>{settings[mode]} min session</span>
      </div>

      <div className="ff-timer__controls">
        <button type="button" className="ff-timer__secondary" onClick={resetTimer}
          aria-label="Reset timer" title="Reset timer"><RotateCcw size={19} /></button>
        <motion.button type="button" className="ff-timer__primary" onClick={toggleTimer}
          whileHover={reducedMotion ? undefined : { scale: 1.04 }}
          whileTap={reducedMotion ? undefined : { scale: 0.96 }}>
          {isRunning ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          {isRunning ? "Pause" : timeLeft < duration ? "Resume" : "Start Focus"}
        </motion.button>
        <button type="button" className="ff-timer__secondary" onClick={skipSession}
          aria-label="Skip session" title="Skip session"><SkipForward size={19} /></button>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.p key={message} role="status" className="ff-timer__message"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="ff-timer__stats">
        <div className="ff-timer__stat">
          <span className="ff-timer__stat-icon"><Flame size={20} /></span>
          <div><strong>{todayStats.completedSessions}</strong><small>Sessions today</small></div>
        </div>
        <div className="ff-timer__stat">
          <span className="ff-timer__stat-icon"><CheckCircle2 size={20} /></span>
          <div><strong>{todayStats.totalMinutes}</strong><small>Focus minutes</small></div>
        </div>
      </div>
      <p className="ff-timer__footer-note"><Sparkles size={14} />
        {settings.autoBreaks ? "Automatic breaks enabled" : "Manual breaks enabled"}
      </p>

      {showSettings && createPortal(
        <div className="ff-timer-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowSettings(false);
        }}>
          <motion.div className="ff-timer-modal" role="dialog" aria-modal="true"
            aria-label="Pomodoro timer settings"
            initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}>
            <div className="ff-timer-modal__header">
              <div><h3><Settings2 size={20} /> Timer Settings</h3>
                <p>Make your study routine your own.</p></div>
              <button type="button" className="ff-timer__icon-button" onClick={() => setShowSettings(false)} aria-label="Close settings"><X size={20} /></button>
            </div>
            <div className="ff-timer-modal__durations">
              {(["focus", "short", "long"] as Mode[]).map((item) => (
                <label key={item}><span>{modeLabels[item]}</span>
                  <input type="number" min={1} max={180} value={draftSettings[item]}
                    onChange={(event) => setDraftSettings((previous) => ({ ...previous, [item]: Number(event.target.value) }))} />
                </label>
              ))}
            </div>
            <p className="ff-timer-modal__hint">Durations in minutes (1–180)</p>
            <div className="ff-timer-modal__options">
              <label><span>Automatically start breaks</span><input type="checkbox" checked={draftSettings.autoBreaks}
                onChange={(event) => setDraftSettings((previous) => ({ ...previous, autoBreaks: event.target.checked }))} /></label>
              <label><span>Automatically start focus sessions</span><input type="checkbox" checked={draftSettings.autoFocus}
                onChange={(event) => setDraftSettings((previous) => ({ ...previous, autoFocus: event.target.checked }))} /></label>
              <label><span>{draftSettings.notifications ? <Bell size={17} /> : <BellOff size={17} />} Desktop notifications</span>
                <input type="checkbox" checked={draftSettings.notifications}
                  onChange={(event) => setDraftSettings((previous) => ({ ...previous, notifications: event.target.checked }))} /></label>
            </div>
            {draftSettings.notifications && (
              <div className="ff-timer-modal__permission">
                <span>Notification permission: {notificationPermission}</span>
                {notificationPermission === "default" && (
                  <button type="button" onClick={requestNotifications}><Bell size={16} /> Enable browser notifications</button>
                )}
              </div>
            )}
            <button type="button" className="ff-timer-modal__save" onClick={saveSettings}><Save size={18} /> Save Settings</button>
          </motion.div>
        </div>, document.body
      )}
    </section>
  );
}
