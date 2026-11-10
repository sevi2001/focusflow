import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import MagicalGirl from "./MagicalGirl";
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, Clock3, Flame, Heart, Moon, Save, Sparkles,
  Star, Target, Timer, TrendingUp, Trophy, WandSparkles,
} from "lucide-react";
import StorageManager from "./StorageManager";
import {
  calculateStreak, getLastSevenDays, getLocalDate, getStudyHistory,
  subscribeToStudyHistory, updateDailyGoal, type StudyHistory,
} from "../lib/studyStats";
import "./StudyDashboard.css";

type StoredTask = { id: string; date: string; completed: boolean };
const TASKS_KEY = "focusflow_daily_tasks";
const encouragements = [
  "You're doing amazing! One little step at a time. ♡",
  "A cozy study session is a gift to your future self! ✨",
  "I'm cheering for you! Remember to drink water. 🌷",
  "Progress is progress, even on the slow days. 💜",
  "You've got this! Let's make today magical. ⭐",
];

function readTasks(): StoredTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is StoredTask =>
      item !== null && typeof item === "object" &&
      typeof item.id === "string" && typeof item.date === "string" &&
      typeof item.completed === "boolean"
    );
  } catch { return []; }
}

function formatTime(minutes: number) {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function StudyGirl({ celebrating, onCheer }: { celebrating: boolean; onCheer: () => void }) {
  return (
    <motion.button
      type="button" className="ff-girl-scene" onClick={onCheer}
      aria-label="Ask your cartoon study buddy for encouragement"
      whileTap={{ scale: 0.97 }}
    >
      <span className="ff-girl-star ff-girl-star-one">✦</span>
      <span className="ff-girl-star ff-girl-star-two">✧</span>
      <span className="ff-girl-heart">{celebrating ? "💖" : "♡"}</span>
      <span className="ff-girl-books">📚</span>
      <span className="ff-girl-mug">☕</span>
      <span className="ff-girl-hair-back" />
      <span className="ff-girl-body" />
      <span className="ff-girl-face">
        <span className="ff-girl-eye ff-girl-eye-left" />
        <span className="ff-girl-eye ff-girl-eye-right" />
        <span className="ff-girl-blush ff-girl-blush-left" />
        <span className="ff-girl-blush ff-girl-blush-right" />
        <span className="ff-girl-mouth" />
      </span>
      <span className="ff-girl-bangs" />
      <span className="ff-girl-bow">🎀</span>
      <span className="ff-girl-headphone ff-girl-headphone-left" />
      <span className="ff-girl-headphone ff-girl-headphone-right" />
      <span className="ff-girl-arm" />
      <span className="ff-girl-laptop">✦ FocusFlow</span>
      <span className="ff-girl-desk" />
      <span className="ff-girl-tap">Tap me for encouragement ✨</span>
    </motion.button>
  );
}

<MagicalGirl />

export default function StudyDashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<StudyHistory>(getStudyHistory);
  const [tasks, setTasks] = useState<StoredTask[]>(readTasks);
  const [today, setToday] = useState(getLocalDate);
  const [goalInput, setGoalInput] = useState(() => String(getStudyHistory().dailyGoal));
  const [goalMessage, setGoalMessage] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setHistory(getStudyHistory());
      setTasks(readTasks());
      setToday(getLocalDate());
    };
    const unsubscribe = subscribeToStudyHistory(refresh);
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => { setGoalInput(String(history.dailyGoal)); }, [history.dailyGoal]);

  const todayStats = history.days.find(day => day.date === today) ?? { date: today, sessions: 0, minutes: 0 };
  const totalSessions = history.days.reduce((sum, day) => sum + day.sessions, 0);
  const totalMinutes = history.days.reduce((sum, day) => sum + day.minutes, 0);
  const studyDays = history.days.filter(day => day.minutes > 0).length;
  const streak = calculateStreak(history.days);
  const todayTasks = tasks.filter(task => task.date === today);
  const completedTasks = todayTasks.filter(task => task.completed).length;
  const taskProgress = todayTasks.length ? Math.round(completedTasks / todayTasks.length * 100) : 0;
  const goalProgress = Math.min(100, Math.round(todayStats.minutes / history.dailyGoal * 100));
  const weeklyData = useMemo(() => getLastSevenDays().map(date => {
    const day = history.days.find(item => item.date === date);
    return {
      date, minutes: day?.minutes ?? 0, sessions: day?.sessions ?? 0,
      label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    };
  }), [history, today]);
  const weeklyMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  const weeklySessions = weeklyData.reduce((sum, day) => sum + day.sessions, 0);
  const maxMinutes = Math.max(history.dailyGoal, ...weeklyData.map(day => day.minutes), 1);

  const calendar = useMemo(() => {
    const base = new Date(`${today}T12:00:00`);
    const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1, 12);
    const year = first.getFullYear();
    const month = first.getMonth();
    const offset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const studied = new Map(history.days.map(day => [day.date, day.minutes]));
    const cells: Array<{ date: string; day: number; minutes: number } | null> = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = getLocalDate(new Date(year, month, day, 12));
      cells.push({ date, day, minutes: studied.get(date) ?? 0 });
    }
    return { title: first.toLocaleDateString(undefined, { month: "long", year: "numeric" }), cells };
  }, [history.days, monthOffset, today]);

  const achievements = [
    { name: "First Spark", icon: "🌱", unlocked: totalSessions >= 1, detail: "Finish 1 session" },
    { name: "Study Star", icon: "⭐", unlocked: totalSessions >= 5, detail: "Finish 5 sessions" },
    { name: "Focus Flame", icon: "🔥", unlocked: streak >= 3, detail: "3-day streak" },
    { name: "Cozy Scholar", icon: "📚", unlocked: totalMinutes >= 600, detail: "Study 10 hours" },
    { name: "Moonlight", icon: "🌙", unlocked: streak >= 7, detail: "7-day streak" },
    { name: "Dream Chaser", icon: "🏆", unlocked: totalSessions >= 25, detail: "Finish 25 sessions" },
  ];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const cards = [
    { title: "Focus Today", value: formatTime(todayStats.minutes), icon: Clock3, color: "pink", subtitle: "Minutes of magic" },
    { title: "Sessions Today", value: String(todayStats.sessions), icon: Timer, color: "lavender", subtitle: "Pomodoros completed" },
    { title: "Study Streak", value: `${streak} ${streak === 1 ? "day" : "days"}`, icon: Flame, color: "peach", subtitle: "Keep your flame glowing" },
    { title: "Tasks Completed", value: `${completedTasks}/${todayTasks.length}`, icon: CheckCircle2, color: "mint", subtitle: "Today's little victories" },
  ];
  const circumference = 2 * Math.PI * 88;

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(goalInput);
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      setGoalMessage("Enter a goal between 1 and 1440 minutes.");
      return;
    }
    updateDailyGoal(value);
    setHistory(getStudyHistory());
    setGoalMessage("Daily goal saved! ✨");
  }

  function cheer() {
    setQuoteIndex(previous => (previous + 1) % encouragements.length);
    setCelebrating(true);
    window.setTimeout(() => setCelebrating(false), 1600);
  }
  <button
  type="button"
  onClick={() => navigate("/rewards")}
  className="dashboard-shop-button"
>
  <span>🎁</span>
  Magical Rewards Shop
  <span>✨</span>
</button>

  return (
    <div className="dashboard-page">
      <div className="ff-sky-decor" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span><span>✦</span></div>
      <header className="dashboard-header">
        <button type="button" onClick={() => navigate("/study-room")} className="dashboard-back"><ArrowLeft size={17} /> Study Room</button>
        <div className="ff-dashboard-brand"><Moon size={22} /> Focus<span>Flow</span><Sparkles size={16} /></div>
        <span className="dashboard-header-tag"><Star size={15} /> Your cozy study journey</span>
      </header>
      <main className="dashboard-main">
        <motion.section className="dashboard-welcome" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <div className="ff-welcome-copy">
            <p className="dashboard-eyebrow"><Sparkles size={16} /> YOUR MAGICAL STUDY SPACE</p>
            <h1>Every little step <span>sparkles ✨</span></h1>
            <p className="dashboard-description">Track your focus, celebrate your wins, and grow at your own pace. Your study buddy is cheering you on!</p>
            <AnimatePresence mode="wait"><motion.p key={quoteIndex} className="ff-girl-quote" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{encouragements[quoteIndex]}</motion.p></AnimatePresence>
            <button type="button" onClick={() => navigate("/study-room")} className="dashboard-study-button">Let's Study <ArrowRight size={17} /></button>
          </div>
          <StudyGirl celebrating={celebrating || goalProgress === 100} onCheer={cheer} />
        </motion.section>

        <div className="dashboard-stats-grid">
          {cards.map((card, index) => { const Icon = card.icon; return (
            <motion.div key={card.title} className={`dashboard-stat-card ff-stat-${card.color}`} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -6, scale: 1.015 }}>
              <div className="dashboard-stat-top"><span>{card.title}</span><span className="dashboard-stat-icon"><Icon size={22} /></span></div>
              <strong className="dashboard-stat-value">{card.value}</strong><p className="dashboard-stat-subtitle">{card.subtitle}</p><span className="ff-stat-sparkle" aria-hidden="true">✦</span>
            </motion.div>
          ); })}
        </div>

        <div className="dashboard-content-grid">
          <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="dashboard-panel-heading"><div><h2><TrendingUp size={20} /> Weekly Focus Magic</h2><p>Your focus time over the last seven days</p></div><span className="dashboard-panel-badge">{formatTime(weeklyMinutes)}</span></div>
            <div className="dashboard-chart" role="img" aria-label={weeklyData.map(day => `${day.label}: ${day.minutes} minutes`).join(", ")}>
              <div className="dashboard-chart-grid"><span>{maxMinutes}m</span><span>{Math.round(maxMinutes / 2)}m</span><span>0m</span></div>
              <div className="dashboard-chart-columns">{weeklyData.map((day, index) => (
                <div key={day.date} className="dashboard-chart-column"><div className="dashboard-bar-track"><motion.div className={`dashboard-bar ${day.date === today ? "dashboard-bar-today" : ""}`} initial={{ height: 0 }} animate={{ height: `${day.minutes / maxMinutes * 100}%` }} transition={{ duration: 0.85, delay: index * 0.08 }} title={`${day.minutes} minutes, ${day.sessions} sessions`} /></div><span className="dashboard-day-label">{day.label}</span><span className="dashboard-day-value">{day.minutes}m</span></div>
              ))}</div>
            </div>
            <div className="dashboard-chart-footer"><span><CalendarDays size={15} /> Last 7 days</span><span>✦ {weeklySessions} completed sessions</span></div>
          </motion.section>

          <motion.section className="dashboard-panel ff-goal-panel" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
            <div className="dashboard-panel-heading"><div><h2><Target size={20} /> Daily Focus Goal</h2><p>Make your dreams bloom 🌷</p></div></div>
            <div className="dashboard-goal-ring"><svg viewBox="0 0 220 220" aria-hidden="true"><defs><linearGradient id="ffGoalGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f9a8d4" /><stop offset="100%" stopColor="#c4b5fd" /></linearGradient></defs><circle cx="110" cy="110" r="88" className="dashboard-ring-track" /><motion.circle cx="110" cy="110" r="88" className="dashboard-ring-progress" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - goalProgress / 100) }} transition={{ duration: 1.2 }} /></svg><div className="dashboard-goal-center"><strong>{goalProgress}%</strong><span>of today's goal</span><span className="ff-goal-sparkle">✦</span></div></div>
            <p className="dashboard-goal-description"><strong>{formatTime(todayStats.minutes)}</strong> of <strong>{formatTime(history.dailyGoal)}</strong> completed</p>
            {goalProgress === 100 && <p className="dashboard-goal-success">🎉 Goal achieved! Your study buddy is proud!</p>}
            <form onSubmit={saveGoal} className="dashboard-goal-form"><label htmlFor="daily-focus-goal">Daily goal (minutes)</label><div><input id="daily-focus-goal" type="number" min={1} max={1440} value={goalInput} onChange={event => { setGoalInput(event.target.value); setGoalMessage(""); }} /><button type="submit"><Save size={15} /> Save</button></div></form>
            {goalMessage && <p className="dashboard-goal-message" role="status">{goalMessage}</p>}
          </motion.section>
        </div>

        <div className="dashboard-bottom-grid">
          <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <div className="dashboard-panel-heading"><div><h2><CalendarDays size={20} /> Study Streak Calendar</h2><p>Every glowing day is a little victory</p></div></div>
            <div className="ff-calendar-top"><button type="button" aria-label="Previous month" onClick={() => setMonthOffset(n => n - 1)}><ChevronLeft size={18} /></button><strong>{calendar.title}</strong><button type="button" aria-label="Next month" onClick={() => setMonthOffset(n => Math.min(0, n + 1))} disabled={monthOffset === 0}><ChevronRight size={18} /></button></div>
            <div className="ff-calendar-grid">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span className="ff-calendar-weekday" key={i}>{d}</span>)}{calendar.cells.map((cell, i) => cell ? <div key={cell.date} title={`${cell.date}: ${formatTime(cell.minutes)}`} className={`ff-calendar-day ${cell.minutes > 0 ? "ff-calendar-studied" : ""} ${cell.date === today ? "ff-calendar-today" : ""}`}>{cell.day}{cell.minutes > 0 && <span>✦</span>}</div> : <div key={`empty-${i}`} />)}</div>
            <p className="ff-calendar-note">✦ Glowing days mean you completed focus time</p>
          </motion.section>
          <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="dashboard-panel-heading"><div><h2><Trophy size={20} /> Magical Achievements</h2><p>Collect badges as your journey grows</p></div><span className="dashboard-panel-badge">{unlockedCount}/{achievements.length}</span></div>
            <div className="ff-achievement-grid">{achievements.map(a => <div key={a.name} className={`ff-achievement ${a.unlocked ? "ff-achievement-unlocked" : "ff-achievement-locked"}`} title={a.detail}><span className="ff-achievement-icon">{a.unlocked ? a.icon : "🔒"}</span><strong>{a.name}</strong><small>{a.detail}</small></div>)}</div>
          </motion.section>
        </div>

        <div className="dashboard-bottom-grid">
          <section className="dashboard-panel"><div className="dashboard-panel-heading"><div><h2><Timer size={20} /> All-Time Study Summary</h2><p>Look how far you've come!</p></div></div><div className="dashboard-mini-stats"><div><span>Total Focus Time</span><strong>{formatTime(totalMinutes)}</strong></div><div><span>Total Sessions</span><strong>{totalSessions}</strong></div><div><span>Weekly Sessions</span><strong>{weeklySessions}</strong></div><div><span>Study Days</span><strong>{studyDays}</strong></div></div></section>
          <section className="dashboard-panel"><div className="dashboard-panel-heading"><div><h2><CheckCircle2 size={20} /> Today's Little Victories</h2><p>One task at a time, you've got this!</p></div></div><div className="dashboard-task-summary"><strong>{taskProgress}%</strong><span>{completedTasks} of {todayTasks.length} tasks completed</span></div><div className="dashboard-task-track"><motion.div initial={{ width: 0 }} animate={{ width: `${taskProgress}%` }} transition={{ duration: 0.9 }} /></div><button type="button" onClick={() => navigate("/study-room")} className="dashboard-task-link">Manage Today's Tasks <ArrowRight size={16} /></button></section>
        </div>
        <div className="ff-dashboard-goodbye"><WandSparkles size={18} /> Small steps, peaceful progress, brighter days. <Heart size={17} /></div>
        <div className="ff-dashboard-storage"><StorageManager /></div>
      </main>
    </div>
  );
}
