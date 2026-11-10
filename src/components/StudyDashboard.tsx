
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Moon,
  Save,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

import {
  calculateStreak,
  getLastSevenDays,
  getLocalDate,
  getStudyHistory,
  subscribeToStudyHistory,
  updateDailyGoal,
  type StudyHistory,
} from "../lib/studyStats";

import "./StudyDashboard.css";

type StoredTask = {
  id: string;
  date: string;
  completed: boolean;
};

const TASKS_KEY = "focusflow_daily_tasks";

function readTasks(): StoredTask[] {
  try {
    const value = localStorage.getItem(TASKS_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (task): task is StoredTask =>
        task !== null &&
        typeof task === "object" &&
        typeof task.id === "string" &&
        typeof task.date === "string" &&
        typeof task.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);

  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;

  return `${hours}h ${remaining}m`;
}

export default function StudyDashboard() {
  const navigate = useNavigate();

  const [history, setHistory] =
    useState<StudyHistory>(getStudyHistory);

  const [tasks, setTasks] = useState<StoredTask[]>(readTasks);
  const [today, setToday] = useState(getLocalDate);

  const [goalInput, setGoalInput] = useState(
    () => String(getStudyHistory().dailyGoal)
  );

  const [goalMessage, setGoalMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      const nextHistory = getStudyHistory();

      setHistory(nextHistory);
      setTasks(readTasks());
      setToday(getLocalDate());
    };

    const unsubscribe = subscribeToStudyHistory(refresh);

    const interval = window.setInterval(refresh, 60_000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    setGoalInput(String(history.dailyGoal));
  }, [history.dailyGoal]);

  const todayStats = history.days.find(
    (day) => day.date === today
  ) ?? {
    date: today,
    sessions: 0,
    minutes: 0,
  };

  const totalSessions = history.days.reduce(
    (sum, day) => sum + day.sessions,
    0
  );

  const totalMinutes = history.days.reduce(
    (sum, day) => sum + day.minutes,
    0
  );

  const todayTasks = tasks.filter(
    (task) => task.date === today
  );

  const completedTasks = todayTasks.filter(
    (task) => task.completed
  ).length;

  const taskProgress =
    todayTasks.length > 0
      ? Math.round(
          (completedTasks / todayTasks.length) * 100
        )
      : 0;

  const goalProgress = Math.min(
    100,
    Math.round(
      (todayStats.minutes / history.dailyGoal) * 100
    )
  );

  const streak = calculateStreak(history.days);

  const weeklyData = useMemo(() => {
    return getLastSevenDays().map((date) => {
      const found = history.days.find(
        (day) => day.date === date
      );

      return {
        date,
        minutes: found?.minutes ?? 0,
        sessions: found?.sessions ?? 0,
        label: new Date(
          `${date}T12:00:00`
        ).toLocaleDateString(undefined, {
          weekday: "short",
        }),
      };
    });
  }, [history, today]);

  const weeklyMinutes = weeklyData.reduce(
    (sum, day) => sum + day.minutes,
    0
  );

  const weeklySessions = weeklyData.reduce(
    (sum, day) => sum + day.sessions,
    0
  );

  const maxMinutes = Math.max(
    history.dailyGoal,
    ...weeklyData.map((day) => day.minutes),
    1
  );

  const saveGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = Number(goalInput);

    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > 1440
    ) {
      setGoalMessage(
        "Enter a goal between 1 and 1440 minutes."
      );
      return;
    }

    updateDailyGoal(value);
    setHistory(getStudyHistory());
    setGoalMessage("Daily goal saved! ✨");
  };

  const cards = [
    {
      title: "Focus Today",
      value: formatTime(todayStats.minutes),
      subtitle: "Time spent studying today",
      icon: Clock3,
      color: "amber",
    },
    {
      title: "Sessions Today",
      value: String(todayStats.sessions),
      subtitle: "Completed Pomodoro sessions",
      icon: Timer,
      color: "purple",
    },
    {
      title: "Study Streak",
      value: `${streak} ${streak === 1 ? "day" : "days"}`,
      subtitle: "Consecutive study days",
      icon: Flame,
      color: "orange",
    },
    {
      title: "Tasks Completed",
      value: `${completedTasks}/${todayTasks.length}`,
      subtitle: "Today's task completion",
      icon: CheckCircle2,
      color: "green",
    },
  ] as const;

  const circumference = 2 * Math.PI * 88;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <button
          onClick={() => navigate("/study-room")}
          className="dashboard-back"
        >
          <ArrowLeft size={18} />
          Study Room
        </button>

        <div className="flex items-center gap-2 text-xl font-bold">
          <Moon className="text-amber-300" />
          Focus<span className="text-amber-300">Flow</span>
        </div>

        <span className="dashboard-header-tag">
          <Sparkles size={15} />
          Your study journey
        </span>
      </header>

      <main className="dashboard-main">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-welcome"
        >
          <div>
            <p className="dashboard-eyebrow">
              <Sparkles size={15} />
              PERSONAL STUDY DASHBOARD
            </p>

            <h1>
              Your Focus <span>Journey ✨</span>
            </h1>

            <p className="dashboard-description">
              Every focused minute matters. Celebrate your
              progress and keep building better study habits.
            </p>
          </div>

          <button
            onClick={() => navigate("/study-room")}
            className="dashboard-study-button"
          >
            Start Studying
            <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Summary cards */}
        <div className="dashboard-stats-grid">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.09 }}
                whileHover={{ y: -5 }}
                className={`dashboard-stat-card dashboard-${card.color}`}
              >
                <div className="dashboard-stat-top">
                  <span>{card.title}</span>
                  <div className="dashboard-stat-icon">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="dashboard-stat-value">
                  {card.value}
                </p>

                <p className="dashboard-stat-subtitle">
                  {card.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="dashboard-content-grid">
          {/* Weekly focus chart */}
          <motion.section
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="dashboard-panel"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  <TrendingUp size={21} />
                  Weekly Focus
                </h2>

                <p>
                  Your study activity over the last 7 days
                </p>
              </div>

              <span className="dashboard-panel-badge">
                {formatTime(weeklyMinutes)}
              </span>
            </div>

            <div
              className="dashboard-chart"
              role="img"
              aria-label={`Focus minutes for the last seven days: ${weeklyData
                .map(
                  (day) =>
                    `${day.label} ${day.date}: ${day.minutes} minutes`
                )
                .join(", ")}`}
            >
              <div className="dashboard-chart-grid">
                <span>{maxMinutes}m</span>
                <span>{Math.round(maxMinutes / 2)}m</span>
                <span>0m</span>
              </div>

              <div className="dashboard-chart-columns">
                {weeklyData.map((day, index) => {
                  const height =
                    (day.minutes / maxMinutes) * 100;

                  return (
                    <div
                      key={day.date}
                      className="dashboard-chart-column"
                    >
                      <div className="dashboard-bar-track">
                        <motion.div
                          className={`dashboard-bar ${
                            day.date === today
                              ? "dashboard-bar-today"
                              : ""
                          }`}
                          initial={{ height: 0 }}
                          animate={{
                            height: `${height}%`,
                          }}
                          transition={{
                            duration: 0.75,
                            delay: index * 0.07,
                            ease: "easeOut",
                          }}
                          title={`${day.minutes} minutes, ${day.sessions} sessions`}
                        />
                      </div>

                      <span className="dashboard-day-label">
                        {day.label}
                      </span>

                      <span className="dashboard-day-value">
                        {day.minutes}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dashboard-chart-footer">
              <span>
                <CalendarDays size={16} />
                Last 7 days
              </span>

              <span>
                {weeklySessions} completed sessions
              </span>
            </div>
          </motion.section>

          {/* Daily focus goal */}
          <motion.section
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="dashboard-panel"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  <Target size={21} />
                  Daily Focus Goal
                </h2>

                <p>Make every minute count</p>
              </div>
            </div>

            <div className="dashboard-goal-ring">
              <svg viewBox="0 0 220 220">
                <circle
                  cx="110"
                  cy="110"
                  r="88"
                  className="dashboard-ring-track"
                />

                <motion.circle
                  cx="110"
                  cy="110"
                  r="88"
                  className="dashboard-ring-progress"
                  strokeDasharray={circumference}
                  initial={{
                    strokeDashoffset: circumference,
                  }}
                  animate={{
                    strokeDashoffset:
                      circumference *
                      (1 - goalProgress / 100),
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeOut",
                  }}
                />
              </svg>

              <div className="dashboard-goal-center">
                <strong>{goalProgress}%</strong>
                <span>of daily goal</span>
              </div>
            </div>

            <p className="dashboard-goal-description">
              <strong>{todayStats.minutes}</strong> of{" "}
              <strong>{history.dailyGoal}</strong> minutes
              completed
            </p>

            {goalProgress === 100 && (
              <p className="dashboard-goal-success">
                🎉 Daily goal achieved!
              </p>
            )}

            <form
              onSubmit={saveGoal}
              className="dashboard-goal-form"
            >
              <label htmlFor="daily-focus-goal">
                Daily goal (minutes)
              </label>

              <div>
                <input
                  id="daily-focus-goal"
                  type="number"
                  min={1}
                  max={1440}
                  value={goalInput}
                  onChange={(event) => {
                    setGoalInput(event.target.value);
                    setGoalMessage("");
                  }}
                />

                <button type="submit">
                  <Save size={16} />
                  Save
                </button>
              </div>
            </form>

            {goalMessage && (
              <p
                role="status"
                className="dashboard-goal-message"
              >
                {goalMessage}
              </p>
            )}
          </motion.section>
        </div>

        {/* Additional statistics */}
        <div className="dashboard-bottom-grid">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="dashboard-panel"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  <Timer size={21} />
                  All-Time Study Summary
                </h2>
                <p>Your accumulated focus progress</p>
              </div>
            </div>

            <div className="dashboard-mini-stats">
              <div>
                <span>Total Focus Time</span>
                <strong>{formatTime(totalMinutes)}</strong>
              </div>

              <div>
                <span>Total Sessions</span>
                <strong>{totalSessions}</strong>
              </div>

              <div>
                <span>Weekly Sessions</span>
                <strong>{weeklySessions}</strong>
              </div>

              <div>
                <span>Study Days</span>
                <strong>
                  {
                    history.days.filter(
                      (day) => day.minutes > 0
                    ).length
                  }
                </strong>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="dashboard-panel"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  <CheckCircle2 size={21} />
                  Daily Task Progress
                </h2>

                <p>Complete your planned study tasks</p>
              </div>
            </div>

            <div className="dashboard-task-summary">
              <strong>{taskProgress}%</strong>
              <span>
                {completedTasks} of {todayTasks.length} tasks
                completed
              </span>
            </div>

            <div className="dashboard-task-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${taskProgress}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>

            <button
              onClick={() => navigate("/study-room")}
              className="dashboard-task-link"
            >
              Manage Today's Tasks
              <ArrowRight size={16} />
            </button>
          </motion.section>
        </div>

        <p className="dashboard-footer-note">
          🌙 Small steps, peaceful progress, brighter days.
        </p>
      </main>
    </div>
  );
}
