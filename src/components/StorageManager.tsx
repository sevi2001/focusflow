
import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
} from "lucide-react";

import {
  downloadBackup,
  restoreBackup,
} from "../lib/storage";

export default function StorageManager() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    try {
      downloadBackup();
      setError(false);
      setMessage("Your FocusFlow backup was downloaded.");
    } catch {
      setError(true);
      setMessage("Unable to export your data.");
    }
  };

  const handleRestore = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setBusy(true);
    setMessage("");

    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error(
          "Backup file must be smaller than 2 MB."
        );
      }

      const content = await file.text();
      const parsed: unknown = JSON.parse(content);

      const confirmed = window.confirm(
        "Restore this backup? Current FocusFlow data will be replaced."
      );

      if (!confirmed) return;

      restoreBackup(parsed);

      window.alert(
        "Backup restored successfully. FocusFlow will reload."
      );

      window.location.reload();
    } catch (caught) {
      setError(true);
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Unable to restore this backup."
      );
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#151a30] p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300">
          <Database size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Your FocusFlow Data
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Keep a backup of your study progress
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/5 p-4">
        <ShieldCheck
          size={19}
          className="shrink-0 text-emerald-300"
        />

        <p className="text-xs leading-6 text-slate-300">
          Your study history, task planner, timer settings,
          and preferences are stored in this browser.
          Export a backup before clearing browser data
          or switching devices.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-[#172033]"
        >
          <Download size={17} />
          Export Backup
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Upload size={17} />
          {busy ? "Restoring..." : "Restore Backup"}
        </motion.button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestore}
        className="hidden"
        aria-label="Select FocusFlow backup file"
      />

      {message && (
        <p
          role="status"
          className={`mt-4 text-xs ${
            error ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
