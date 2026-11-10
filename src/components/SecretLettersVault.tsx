import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Download, Heart, KeyRound, LockKeyhole, UnlockKeyhole, Upload } from "lucide-react";
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
        <motion.div className="secret-vault-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="secret-vault-illustration">💌<span>🔐</span></div>
          <span className="secret-vault-kicker">YOUR PRIVATE LITTLE CORNER</span>
          <h2>Secret Letters</h2>
          <p className="secret-vault-description">
            {exists ? "Your thoughts are safe behind a little golden lock. Enter your password to read them."
              : "Create a secret password for your own encrypted postcard diary."}
          </p>
          {!exists && legacyExists() && (
            <p className="secret-vault-warning">Existing postcards detected. Back them up first; creating the vault will encrypt and migrate them.</p>
          )}
          <div className="secret-vault-backup" style={{ margin: "20px 0", padding: 16, border: "1px solid rgba(255,255,255,.2)", borderRadius: 14 }}>
            <h3 style={{ marginTop: 0 }}>💌 Restore encrypted postcards</h3>
            <p>Choose the backup exported from localhost, then enter the password used there. Importing replaces any vault already saved on this website.</p>
            <input type="file" accept=".json,application/json" aria-label="Choose encrypted postcard backup"
              onChange={e => setRestoreFile(e.target.files?.[0] ?? null)} />
            <label htmlFor="restore-vault-password" style={{ display: "block", marginTop: 12 }}>Original vault password</label>
            <input id="restore-vault-password" type="password" autoComplete="off"
              value={restorePassword} onChange={e => setRestorePassword(e.target.value)} />
            <button type="button" onClick={importBackup} disabled={!restoreFile || !restorePassword || restoring}
              style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <Upload size={17} /> {restoring ? "Verifying backup..." : "Restore encrypted backup"}
            </button>
          </div>
          {backupStatus && <p className="secret-vault-warning" role="status">{backupStatus}</p>}
          <form className="secret-vault-form" onSubmit={submit}>
            <label htmlFor="vault-password">{exists ? "Your secret password" : "Create a password (12+ characters)"}</label>
            <input id="vault-password" type="password" autoComplete={exists ? "current-password" : "new-password"}
              minLength={exists ? undefined : 12} required value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Your secret password" />
            {!exists && <>
              <label htmlFor="vault-confirm">Confirm password</label>
              <input id="vault-confirm" type="password" autoComplete="new-password" minLength={12} required
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type your password again" />
            </>}
            <button type="submit" disabled={busy}>
              {exists ? <UnlockKeyhole size={17} /> : <KeyRound size={17} />}
              {busy ? "Please wait..." : exists ? "Unlock My Diary" : "Create My Secret Vault"}
            </button>
          </form>
          {error && <p className="secret-vault-error" role="alert">{error}</p>}
          {notice && <p className="secret-vault-warning" role="status">{notice}</p>}
          <p className="secret-vault-footnote">🔒 Encrypted in this browser. No account or cross-device sync. Forgotten passwords cannot be recovered.</p>
        </motion.div>
      ) : (
        <div>
          <div className="secret-vault-unlocked">
            <div><span>✦ PRIVATE GARDEN ✦</span><h2><Heart size={22} /> My Secret Letters</h2>
              <p>Unlocked on this device · Automatically locks after 5 minutes of inactivity</p></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button type="button" onClick={downloadBackup}><Download size={17} /> Export Encrypted Backup</button>
              <button type="button" onClick={lock}><LockKeyhole size={17} /> Lock My Diary</button>
            </div>
          </div>
          {error && <p className="secret-vault-error" role="alert">{error}</p>}
          {backupStatus && <p className="secret-vault-warning" role="status">{backupStatus}</p>}
          <MyLittleNotes key={revision} initialNotes={session.notes} onPersist={persist} />
        </div>
      )}
    </section>
  );
}
