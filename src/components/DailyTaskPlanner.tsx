
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flag,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import "./DailyTaskPlanner.css";

type Priority = "high" | "medium" | "low";

type Task = {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  date: string;
  createdAt: number;
};

const STORAGE_KEY = "focusflow_daily_tasks";

const priorityConfig = {
  high: {
    label: "High",
    color: "#fb7185",
    className: "task-priority-high",
  },
  medium: {
    label: "Medium",
    color: "#fbbf24",
    className: "task-priority-medium",
  },
  low: {
    label: "Low",
    color: "#6ee7b7",
    className: "task-priority-low",
  },
};

const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;

  const task = value as Partial<Task>;

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    task.title.trim().length > 0 &&
    (task.priority === "high" ||
      task.priority === "medium" ||
      task.priority === "low") &&
    typeof task.completed === "boolean" &&
    typeof task.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(task.date) &&
    typeof task.createdAt === "number" &&
    Number.isFinite(task.createdAt)
  );
}

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidTask);
  } catch {
    return [];
  }
}

function createTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DailyTaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [today, setToday] = useState(getLocalDate);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] =
    useState<Priority>("medium");

  const [showCompleted, setShowCompleted] = useState(true);
  const [error, setError] = useState("");

  // Keep the planner on the current local day.
  useEffect(() => {
    const updateDate = () => {
      setToday(getLocalDate());
    };

    const interval = window.setInterval(updateDate, 60_000);

    window.addEventListener("focus", updateDate);
    document.addEventListener("visibilitychange", updateDate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateDate);
      document.removeEventListener("visibilitychange", updateDate);
    };
  }, []);

  // Save all tasks to Local Storage.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Only show today's tasks.
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.date === today),
    [tasks, today]
  );

  const completedCount = todayTasks.filter(
    (task) => task.completed
  ).length;

  const totalCount = todayTasks.length;

  const pendingCount = totalCount - completedCount;

  const progress =
    totalCount === 0
      ? 0
      : Math.round((completedCount / totalCount) * 100);

  // Sort unfinished tasks first, then by priority.
  const sortedTasks = useMemo(() => {
    return [...todayTasks]
      .filter((task) => showCompleted || !task.completed)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed);
        }

        const priorityDifference =
          priorityOrder[a.priority] - priorityOrder[b.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return a.createdAt - b.createdAt;
      });
  }, [todayTasks, showCompleted]);

  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("Please enter a task name.");
      return;
    }

    if (cleanTitle.length > 120) {
      setError("Task name must be 120 characters or less.");
      return;
    }

    const newTask: Task = {
      id: createTaskId(),
      title: cleanTitle,
      priority,
      completed: false,
      date: getLocalDate(),
      createdAt: Date.now(),
    };

    setToday(newTask.date);
    setTasks((previous) => [...previous, newTask]);

    setTitle("");
    setPriority("medium");
    setError("");
  };

  const toggleTask = (id: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );

    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setError("");
  };

  const saveEditing = (id: string) => {
    const cleanTitle = editTitle.trim();

    if (!cleanTitle) {
      setError("Task name cannot be empty.");
      return;
    }

    if (cleanTitle.length > 120) {
      setError("Task name must be 120 characters or less.");
      return;
    }

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? {
              ...task,
              title: cleanTitle,
              priority: editPriority,
            }
          : task
      )
    );

    setEditingId(null);
    setError("");
  };

  const clearCompleted = () => {
    setTasks((previous) =>
      previous.filter(
        (task) => !(task.date === today && task.completed)
      )
    );
  };

  const dateLabel = new Date(
    `${today}T12:00:00`
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="task-planner">
      {/* Header */}
      <div className="task-planner-header">
        <div className="flex items-center gap-3">
          <div className="task-planner-icon">
            <ClipboardList size={23} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Daily Task Planner
            </h2>

            <p className="text-xs text-slate-400">
              {dateLabel}
            </p>
          </div>
        </div>

        <span className="task-count-badge">
          {pendingCount} left
        </span>
      </div>

      {/* Progress */}
      <div className="task-progress-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Today's Progress
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>

          <motion.span
            key={progress}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-amber-200"
          >
            {progress}%
          </motion.span>
        </div>

        <div
          className="task-progress-track"
          role="progressbar"
          aria-label="Daily task completion"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="task-progress-fill"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          />
        </div>

        {progress === 100 && totalCount > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs text-emerald-300"
          >
            <Sparkles size={15} />
            Amazing! You finished all your tasks today!
          </motion.p>
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="task-add-form">
        <label
          htmlFor="focusflow-task-title"
          className="mb-2 block text-xs text-slate-300"
        >
          What would you like to accomplish?
        </label>

        <input
          id="focusflow-task-title"
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setError("");
          }}
          placeholder="e.g. Revise React hooks"
          className="task-text-input"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={priority}
            aria-label="New task priority"
            onChange={(event) =>
              setPriority(event.target.value as Priority)
            }
            className="task-priority-select"
          >
            <option value="high">🔴 High Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="low">🟢 Low Priority</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="task-add-button"
          >
            <Plus size={18} />
            Add Task
          </motion.button>
        </div>
      </form>

      {error && (
        <p role="alert" className="task-error">
          {error}
        </p>
      )}

      {/* Task List Header */}
      <div className="task-list-heading">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            Today's Tasks
          </h3>

          <span className="text-xs text-slate-500">
            ({totalCount})
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCompleted((previous) => !previous)
          }
          className="text-xs text-amber-200 hover:text-amber-100"
        >
          {showCompleted ? "Hide Done" : "Show Done"}
        </button>
      </div>

      {/* Task Cards */}
      <div className="task-list">
        <AnimatePresence initial={false} mode="popLayout">
          {sortedTasks.map((task) => {
            const isEditing = editingId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`task-item ${
                  task.completed ? "task-item-done" : ""
                }`}
              >
                {isEditing ? (
                  <div className="w-full">
                    <input
                      value={editTitle}
                      maxLength={120}
                      aria-label="Edit task name"
                      onChange={(event) =>
                        setEditTitle(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveEditing(task.id);
                        }

                        if (event.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                      className="task-text-input"
                      autoFocus
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={editPriority}
                        aria-label="Edit task priority"
                        onChange={(event) =>
                          setEditPriority(
                            event.target.value as Priority
                          )
                        }
                        className="task-priority-select"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => saveEditing(task.id)}
                        className="task-small-button task-save-button"
                      >
                        <Save size={15} />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="task-small-button"
                      >
                        <X size={15} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start gap-3">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      aria-label={
                        task.completed
                          ? `Mark ${task.title} incomplete`
                          : `Complete ${task.title}`
                      }
                      aria-pressed={task.completed}
                      className="task-check-button"
                    >
                      {task.completed ? (
                        <CheckCircle2
                          size={23}
                          className="text-emerald-300"
                        />
                      ) : (
                        <Circle
                          size={23}
                          className="text-slate-500"
                        />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`break-words text-sm font-medium ${
                          task.completed
                            ? "text-slate-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </p>

                      <span
                        className={`task-priority-badge ${
                          priorityConfig[task.priority].className
                        }`}
                      >
                        <Flag size={11} />
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(task)}
                        aria-label={`Edit ${task.title}`}
                        className="task-icon-button"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        className="task-icon-button task-delete-button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="task-empty-state"
          >
            {totalCount === 0 ? (
              <>
                <ClipboardList
                  size={34}
                  className="mx-auto mb-3 text-amber-200"
                />
                <p className="font-medium text-white">
                  A fresh start!
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Add your first task and make today productive.
                </p>
              </>
            ) : (
              <>
                <Check
                  size={34}
                  className="mx-auto mb-3 text-emerald-300"
                />
                <p className="font-medium text-white">
                  All visible tasks are complete!
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  You're doing great. Keep it up!
                </p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="task-footer">
        <span className="text-xs text-slate-500">
          <Check size={14} className="inline" />{" "}
          {completedCount} completed
        </span>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={clearCompleted}
            className="text-xs text-rose-300 hover:text-rose-200"
          >
            Clear Completed
          </button>
        )}
      </div>
    </section>
  );
}
