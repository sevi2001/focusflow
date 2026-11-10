
export const FOCUSFLOW_KEYS = [
  "focusflow_timer_settings",
  "focusflow_study_stats",
  "focusflow_study_history",
  "focusflow_daily_tasks",
  "focusflow_ambient_preferences",
  "focusflow_cat_name",
] as const;

export type FocusFlowBackup = {
  app: "FocusFlow";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
};

export function safeRead(
  key: string
): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWrite(
  key: string,
  value: string
): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeReadJSON<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T
): T {
  const raw = safeRead(key);

  if (raw === null) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (validate && !validate(parsed)) {
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

export function safeWriteJSON(
  key: string,
  value: unknown
): boolean {
  try {
    return safeWrite(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function createBackup(): FocusFlowBackup {
  const data: Record<string, string> = {};

  FOCUSFLOW_KEYS.forEach((key) => {
    const value = safeRead(key);

    if (value !== null) {
      data[key] = value;
    }
  });

  return {
    app: "FocusFlow",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  const backup = createBackup();

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `focusflow-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function restoreBackup(
  input: unknown
): void {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid backup file.");
  }

  const backup = input as Partial<FocusFlowBackup>;

  if (
    backup.app !== "FocusFlow" ||
    backup.version !== 1 ||
    !backup.data ||
    typeof backup.data !== "object" ||
    Array.isArray(backup.data)
  ) {
    throw new Error(
      "This is not a supported FocusFlow backup."
    );
  }

  const entries = Object.entries(backup.data);

  for (const [key, value] of entries) {
    if (
      !FOCUSFLOW_KEYS.includes(
        key as (typeof FOCUSFLOW_KEYS)[number]
      ) ||
      typeof value !== "string"
    ) {
      throw new Error("Backup contains invalid data.");
    }

    if (key !== "focusflow_cat_name") {
      try {
        JSON.parse(value);
      } catch {
        throw new Error(
          `Invalid stored JSON for ${key}.`
        );
      }
    }
  }

  // Prepare all changes before writing.
  const previousValues = new Map<string, string | null>();

  FOCUSFLOW_KEYS.forEach((key) => {
    previousValues.set(key, safeRead(key));
  });

  try {
    // A backup is a full snapshot of known FocusFlow keys.
    FOCUSFLOW_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });

    entries.forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch {
    // Attempt to restore the previous state if writing fails.
    previousValues.forEach((value, key) => {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } catch {
        // Storage may be unavailable.
      }
    });

    throw new Error(
      "Could not restore the backup. Your previous data was preserved where possible."
    );
  }
}
