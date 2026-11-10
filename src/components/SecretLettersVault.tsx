import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Download, Heart, KeyRound, LockKeyhole, UnlockKeyhole, Upload, Eye, EyeOff, ChevronDown, ShieldCheck, FileHeart } from "lucide-react";
import MyLittleNotes from "./MyLittleNotes";
import type { LittleNote } from "../lib/littleNotes";
import {
  VAULT_KEY, LEGACY_KEY, createVault, exportEncryptedVault, inspectEncryptedBackup, restoreEncryptedVault, legacyExists,
  migrateLegacyNotes, saveVaultNotes, unlockVault, vaultExists,
  type VaultSession,
} from "../lib/secretVault";
import "./SecretLettersVault.css";

const IDLE_MS = 5 * 60 * 1000;

export default function SecretLettersVault() {
  const [exists, setExists] = useState(() => vaultExists());
  const [session, setSession] = useState<VaultSession | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const sessionRef = useRef<VaultSession | null>(null);
  const writingRef = useRef(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRestorePassword, setShowRestorePassword] = useState(false);

  const downloadBackup = () => {
    try {
      const json = exportEncryptedVault();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `focusflow-encrypted-postcards-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setBackupStatus("Encrypted backup downloaded. Keep it and your password safe.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export backup.");
    }
  };

  const importBackup = async () => {
    if (!restoreFile || !restorePassword || restoring) return;
    setRestoring(true);
    setError("");
    setBackupStatus("");
    try {
      if (!window.isSecureContext || !crypto.subtle) throw new Error("HTTPS or localhost required.");
      if (restoreFile.size > 15_000_000) throw new Error("Backup file is too large.");
      const json = await restoreFile.text();
      const inspected = await inspectEncryptedBackup(json, restorePassword);
      if (vaultExists()) {
        const accepted = window.confirm(
          `This browser already has a private vault. Importing will REPLACE its saved postcards with ${inspected.count} postcards from the backup. Existing Vercel postcards could be lost. Cancel if you need to export the existing vault first. Continue?`
        );
        if (!accepted) return;
      } else {
        const accepted = window.confirm(
          `Restore ${inspected.count} encrypted postcards to this browser? You will unlock them using your ORIGINAL localhost password.`
        );
        if (!accepted) return;
      }
      const count = await restoreEncryptedVault(json, restorePassword);
      sessionRef.current = null;
      setSession(null);
      setExists(true);
      setPassword("");
      setConfirm("");
      setRestorePassword("");
      setRestoreFile(null);
      setRevision(n => n + 1);
      setBackupStatus(`Restored ${count} encrypted postcards. Unlock with your original password.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Restore failed. Existing vault was not intentionally replaced.");
    } finally {
      setRestoring(false);
    }
  };

  const lock = () => {
    sessionRef.current = null;
    setSession(null);
    setPassword("");
    setConfirm("");
    setNotice("");
    setError("");
    setRevision(n => n + 1);
  };

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionRef.current = null;
        setSession(null);
        setPassword("");
        setNotice("");
        setRevision(n => n + 1);
      }, IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach(event => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, reset));
    };
  }, [session]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === VAULT_KEY || event.key === LEGACY_KEY || event.key === null) {
        sessionRef.current = null;
        setSession(null);
        setExists(vaultExists());
        setPassword("");
        setNotice("Storage changed in another tab. Please unlock again.");
        setRevision(n => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!window.isSecureContext || !crypto.subtle) {
        throw new Error("Encryption requires HTTPS or localhost.");
      }
      let opened: VaultSession;
      if (exists) {
        opened = await unlockVault(password);
        if (legacyExists()) {
          const migrated = await migrateLegacyNotes(opened.key);
          opened = { key: opened.key, notes: migrated };
        }
      } else {
        if (password !== confirm) throw new Error("Passwords don't match.");
        opened = await createVault(password);
        setExists(true);
      }
      sessionRef.current = opened;
      setSession(opened);
      setPassword("");
      setConfirm("");
      setRevision(n => n + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open vault.");
    } finally {
      setBusy(false);
    }
  };

  const persist = async (notes: LittleNote[]): Promise<boolean> => {
    const current = sessionRef.current;
    if (!current || writingRef.current || !Array.isArray(notes)) return false;
    writingRef.current = true;
    try {
      await saveVaultNotes(notes, current.key);
      if (sessionRef.current !== current) return false;
      const updated = { key: current.key, notes };
      sessionRef.current = updated;
      setSession(updated);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save encrypted notes.");
      return false;
    } finally {
      writingRef.current = false;
    }
  };

  return (
    <section className="secret-vault" aria-label="Private postcard vault">
      {!session ? (
        <motion.div
          className="secret-vault-panel"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="secret-vault-sparkle secret-vault-sparkle-one" aria-hidden="true">✦</div>
          <div className="secret-vault-sparkle secret-vault-sparkle-two" aria-hidden="true">✧</div>
          <div className="secret-vault-sparkle secret-vault-sparkle-three" aria-hidden="true">♡</div>

          <motion.div
            className="secret-vault-illustration"
            animate={{ y: [0, -7, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <span className="secret-vault-envelope">💌</span>
            <span className="secret-vault-lock">🔐</span>
          </motion.div>
          <span className="secret-vault-kicker">✦ YOUR PRIVATE LITTLE CORNER ✦</span>
          <h2>Secret Letters <span aria-hidden="true">♡</span></h2>
          <p className="secret-vault-description">
            {exists
              ? "Your sweetest thoughts are tucked away behind a little golden lock. Enter your password to visit your private garden."
              : "A tiny, safe place for your memories. Create a password to begin your encrypted postcard diary."}
          </p>

          {!exists && legacyExists() && (
            <p className="secret-vault-warning" role="status">
              Existing postcards detected. Creating your vault will encrypt and migrate them.
            </p>
          )}

          <form className="secret-vault-form" onSubmit={submit}>
            <label htmlFor="vault-password">
              {exists ? "Your secret password" : "Create a password (12+ characters)"}
            </label>
            <div className="secret-vault-password-wrap">
              <KeyRound size={18} aria-hidden="true" />
              <input
                id="vault-password"
                type={showPassword ? "text" : "password"}
                autoComplete={exists ? "current-password" : "new-password"}
                minLength={exists ? undefined : 12}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your secret password"
              />
              <button
                className="secret-vault-eye"
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!exists && (
              <>
                <label htmlFor="vault-confirm">Confirm password</label>
                <div className="secret-vault-password-wrap">
                  <KeyRound size={18} aria-hidden="true" />
                  <input
                    id="vault-confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Type your password again"
                  />
                </div>
              </>
            )}
            <button className="secret-vault-primary" type="submit" disabled={busy}>
              {exists ? <UnlockKeyhole size={18} /> : <KeyRound size={18} />}
              {busy ? "Opening your diary..." : exists ? "Unlock My Diary" : "Create My Secret Vault"}
            </button>
          </form>

          {error && <p className="secret-vault-error" role="alert">{error}</p>}
          {notice && <p className="secret-vault-warning" role="status">{notice}</p>}
          {backupStatus && <p className="secret-vault-success" role="status">{backupStatus}</p>}

          <div className="secret-vault-divider"><span>✦ a little extra magic ✦</span></div>
          <div className="secret-vault-restore">
            <button
              className="secret-vault-restore-toggle"
              type="button"
              onClick={() => setShowRestore(value => !value)}
              aria-expanded={showRestore}
              aria-controls="secret-vault-restore-panel"
            >
              <span className="secret-vault-restore-icon"><FileHeart size={20} /></span>
              <span className="secret-vault-restore-title">
                <strong>Restore My Postcards</strong>
                <small>Bring your encrypted memories back 💌</small>
              </span>
              <ChevronDown className={showRestore ? "is-open" : ""} size={20} />
            </button>
            {showRestore && (
              <motion.div
                id="secret-vault-restore-panel"
                className="secret-vault-restore-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <p>Choose the encrypted backup exported from localhost, then enter its original password. Restoring replaces any existing vault in this browser.</p>
                <label htmlFor="secret-vault-backup-file">Encrypted backup file</label>
                <input
                  id="secret-vault-backup-file"
                  className="secret-vault-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={e => setRestoreFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor="restore-vault-password">Original vault password</label>
                <div className="secret-vault-password-wrap">
                  <KeyRound size={18} aria-hidden="true" />
                  <input
                    id="restore-vault-password"
                    type={showRestorePassword ? "text" : "password"}
                    autoComplete="off"
                    value={restorePassword}
                    onChange={e => setRestorePassword(e.target.value)}
                    placeholder="Password from your localhost diary"
                  />
                  <button
                    className="secret-vault-eye"
                    type="button"
                    onClick={() => setShowRestorePassword(value => !value)}
                    aria-label={showRestorePassword ? "Hide restore password" : "Show restore password"}
                  >
                    {showRestorePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  className="secret-vault-restore-button"
                  type="button"
                  onClick={importBackup}
                  disabled={!restoreFile || !restorePassword || restoring}
                >
                  <Upload size={17} />
                  {restoring ? "Verifying encrypted backup..." : "Restore Encrypted Backup"}
                </button>
              </motion.div>
            )}
          </div>

          <p className="secret-vault-footnote">
            <ShieldCheck size={16} aria-hidden="true" />
            Encrypted in this browser. No automatic sync. Keep your password and backup safe.
          </p>
        </motion.div>
      ) : (
        <div className="secret-vault-opened">
          <div className="secret-vault-unlocked">
            <div>
              <span className="secret-vault-kicker">✦ PRIVATE GARDEN ✦</span>
              <h2><Heart size={24} /> My Secret Letters</h2>
              <p>Your private diary is unlocked. It automatically locks after 5 minutes of inactivity.</p>
            </div>
            <div className="secret-vault-unlocked-actions">
              <button className="secret-vault-export-button" type="button" onClick={downloadBackup}>
                <Download size={17} /> Export Encrypted Backup
              </button>
              <button className="secret-vault-lock-button" type="button" onClick={lock}>
                <LockKeyhole size={17} /> Lock My Diary
              </button>
            </div>
          </div>
          {error && <p className="secret-vault-error" role="alert">{error}</p>}
          {backupStatus && <p className="secret-vault-success" role="status">{backupStatus}</p>}
          <MyLittleNotes key={revision} initialNotes={session.notes} onPersist={persist} />
        </div>
      )}
    </section>
  );
}
