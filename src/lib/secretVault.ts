
import type { LittleNote } from "./littleNotes";

export const VAULT_KEY = "focusflow_secret_vault_v1";
export const LEGACY_KEY = "focusflow_my_little_notes_v1";

const ITERATIONS = 600_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type Envelope = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};

export type VaultSession = {
  key: CryptoKey;
  notes: LittleNote[];
};

function encode64(data: Uint8Array): string {
  let text = "";

  for (const byte of data) {
    text += String.fromCharCode(byte);
  }

  return btoa(text);
}

function decode64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function randomBytes(size: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(size));
  crypto.getRandomValues(bytes);
  return bytes;
}

function validateNotes(value: unknown): LittleNote[] {
  if (!Array.isArray(value)) {
    throw new Error("Saved postcards are not an array.");
  }

  const themes = [
    "pink",
    "lavender",
    "peach",
    "mint",
    "cream",
    "blue",
    "rose",
    "lilac",
    "butter",
    "sage",
    "sky",
    "coral",
    "cotton",
    "matcha",
    "dusty",
    "periwinkle",
    "strawberry",
    "vanilla",
    "seafoam",
    "dreamy",
  ];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.message !== "string" ||
      !themes.includes(item.theme) ||
      typeof item.sticker !== "string" ||
      typeof item.favorite !== "boolean" ||
      typeof item.createdAt !== "number" ||
      typeof item.updatedAt !== "number"
    ) {
      throw new Error(
        "Saved postcards contain invalid data. Nothing was deleted."
      );
    }
  }

  return value as LittleNote[];
}

function readEnvelope(): Envelope | null {
  const raw = localStorage.getItem(VAULT_KEY);

  if (raw === null) return null;

  const value: unknown = JSON.parse(raw);

  if (!value || typeof value !== "object") {
    throw new Error("Invalid vault data.");
  }

  const data = value as Record<string, unknown>;

  if (
    data.version !== 1 ||
    typeof data.salt !== "string" ||
    typeof data.iv !== "string" ||
    typeof data.ciphertext !== "string"
  ) {
    throw new Error(
      "Invalid vault format. Original data was not changed."
    );
  }

  return data as Envelope;
}

export function vaultExists(): boolean {
  return localStorage.getItem(VAULT_KEY) !== null;
}

export function legacyExists(): boolean {
  return localStorage.getItem(LEGACY_KEY) !== null;
}

function readLegacy(): LittleNote[] {
  const raw = localStorage.getItem(LEGACY_KEY);

  return raw === null ? [] : validateNotes(JSON.parse(raw));
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    base,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function decrypt(
  data: Envelope,
  key: CryptoKey
): Promise<LittleNote[]> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: decode64(data.iv),
    },
    key,
    decode64(data.ciphertext)
  );

  return validateNotes(JSON.parse(decoder.decode(plaintext)));
}

async function encrypt(
  notes: LittleNote[],
  key: CryptoKey,
  salt: string
): Promise<Envelope> {
  validateNotes(notes);

  const iv = randomBytes(12);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(JSON.stringify(notes))
  );

  return {
    version: 1,
    salt,
    iv: encode64(iv),
    ciphertext: encode64(new Uint8Array(ciphertext)),
  };
}

async function writeVerified(
  notes: LittleNote[],
  key: CryptoKey,
  salt: string
): Promise<void> {
  const envelope = await encrypt(notes, key, salt);
  const checked = await decrypt(envelope, key);

  if (JSON.stringify(checked) !== JSON.stringify(notes)) {
    throw new Error(
      "Encryption verification failed. Nothing was saved."
    );
  }

  localStorage.setItem(VAULT_KEY, JSON.stringify(envelope));

  const stored = readEnvelope();

  if (
    !stored ||
    JSON.stringify(await decrypt(stored, key)) !==
      JSON.stringify(notes)
  ) {
    throw new Error(
      "Stored vault verification failed. Keep your backup."
    );
  }
}

export async function createVault(
  password: string
): Promise<VaultSession> {
  if (password.length < 12) {
    throw new Error("Use at least 12 characters.");
  }

  if (vaultExists()) {
    throw new Error(
      "A vault already exists. Unlock it instead."
    );
  }

  const notes = readLegacy();
  const salt = randomBytes(16);
  const key = await derive(password, salt);

  await writeVerified(notes, key, encode64(salt));

  // Remove plaintext only after verifying encryption.
  if (legacyExists()) {
    localStorage.removeItem(LEGACY_KEY);
  }

  return { key, notes };
}

export async function unlockVault(
  password: string
): Promise<VaultSession> {
  const envelope = readEnvelope();

  if (!envelope) {
    throw new Error("No vault exists yet.");
  }

  try {
    const key = await derive(
      password,
      decode64(envelope.salt)
    );

    const notes = await decrypt(envelope, key);

    return { key, notes };
  } catch {
    throw new Error(
      "Incorrect password or damaged vault. No data was deleted."
    );
  }
}

export async function saveVaultNotes(
  notes: LittleNote[],
  key: CryptoKey
): Promise<void> {
  const current = readEnvelope();

  if (!current) {
    throw new Error(
      "Vault is missing. Your changes were not saved."
    );
  }

  // Verify the key before writing.
  await decrypt(current, key);

  await writeVerified(notes, key, current.salt);
}

export async function migrateLegacyNotes(
  key: CryptoKey
): Promise<LittleNote[]> {
  const current = readEnvelope();

  if (!current) {
    throw new Error("Vault is missing.");
  }

  const existing = await decrypt(current, key);

  if (!legacyExists()) return existing;

  const legacy = readLegacy();
  const merged = [...existing];

  const existingIds = new Set(
    existing.map((note) => note.id)
  );

  for (const note of legacy) {
    if (!existingIds.has(note.id)) {
      merged.push(note);
      existingIds.add(note.id);
    } else {
      const match = existing.find(
        (item) => item.id === note.id
      );

      if (
        match &&
        JSON.stringify(match) !== JSON.stringify(note)
      ) {
        throw new Error(
          "Conflicting postcard IDs found. Original plaintext notes were preserved."
        );
      }
    }
  }

  await writeVerified(merged, key, current.salt);

  const stored = readEnvelope();

  if (!stored) {
    throw new Error("Migration verification failed.");
  }

  const verified = await decrypt(stored, key);

  if (
    !legacy.every((note) =>
      verified.some(
        (item) =>
          JSON.stringify(item) === JSON.stringify(note)
      )
    )
  ) {
    throw new Error(
      "Migration verification failed. Original notes were preserved."
    );
  }

  localStorage.removeItem(LEGACY_KEY);

  return verified;
}

// ======================================
// ENCRYPTED BACKUP & RESTORE
// ======================================

export type VaultBackup = {
  format: "focusflow-encrypted-vault-backup";
  backupVersion: 1;
  exportedAt: string;
  vault: Envelope;
};

function parseEnvelope(value: unknown): Envelope {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid encrypted vault backup.");
  }

  const data = value as Record<string, unknown>;

  if (
    data.version !== 1 ||
    typeof data.salt !== "string" ||
    typeof data.iv !== "string" ||
    typeof data.ciphertext !== "string"
  ) {
    throw new Error(
      "Unsupported or damaged encrypted vault backup."
    );
  }

  const salt = decode64(data.salt);
  const iv = decode64(data.iv);
  const ciphertext = decode64(data.ciphertext);

  if (
    salt.length !== 16 ||
    iv.length !== 12 ||
    ciphertext.length < 16
  ) {
    throw new Error(
      "Invalid encrypted vault parameters."
    );
  }

  return data as Envelope;
}

// Export the encrypted vault as JSON.
export function exportEncryptedVault(): string {
  const raw = localStorage.getItem(VAULT_KEY);

  if (!raw) {
    throw new Error(
      "No encrypted vault found to back up."
    );
  }

  const vault = parseEnvelope(
    JSON.parse(raw) as unknown
  );

  const backup: VaultBackup = {
    format: "focusflow-encrypted-vault-backup",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    vault,
  };

  return JSON.stringify(backup, null, 2);
}

// Check backup and password before restoring.
export async function inspectEncryptedBackup(
  fileText: string,
  password: string
): Promise<{
  vault: Envelope;
  count: number;
}> {
  if (fileText.length > 15_000_000) {
    throw new Error("Backup file is too large.");
  }

  const parsed: unknown = JSON.parse(fileText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup file.");
  }

  const backup = parsed as Record<string, unknown>;

  if (
    backup.format !== "focusflow-encrypted-vault-backup" ||
    backup.backupVersion !== 1
  ) {
    throw new Error(
      "This is not a supported FocusFlow encrypted backup."
    );
  }

  const vault = parseEnvelope(backup.vault);

  const key = await derive(
    password,
    decode64(vault.salt)
  );

  let notes: LittleNote[];

  try {
    notes = await decrypt(vault, key);
  } catch {
    throw new Error(
      "Incorrect backup password or damaged backup. Nothing was changed."
    );
  }

  return {
    vault,
    count: notes.length,
  };
}

// Restore encrypted postcards safely.
export async function restoreEncryptedVault(
  fileText: string,
  password: string
): Promise<number> {
  const { vault, count } =
    await inspectEncryptedBackup(fileText, password);

  const previous = localStorage.getItem(VAULT_KEY);
  const next = JSON.stringify(vault);

  try {
    localStorage.setItem(VAULT_KEY, next);

    const stored = readEnvelope();

    if (!stored) {
      throw new Error(
        "Restored vault could not be read."
      );
    }

    const key = await derive(
      password,
      decode64(stored.salt)
    );

    const notes = await decrypt(stored, key);

    if (notes.length !== count) {
      throw new Error(
        "Restored postcard count mismatch."
      );
    }

    return count;
  } catch (error) {
    // Restore previous vault if import fails.
    try {
      if (previous === null) {
        localStorage.removeItem(VAULT_KEY);
      } else {
        localStorage.setItem(VAULT_KEY, previous);
      }
    } catch {
      // Keep the original backup file.
    }

    throw error;
  }
}
