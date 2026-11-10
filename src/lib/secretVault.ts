
import type { LittleNote } from "./littleNotes";

export const SECRET_VAULT_KEY = "focusflow_secret_vault_v1";

const LEGACY_NOTES_KEY = "focusflow_my_little_notes_v1";
const ITERATIONS = 600_000;

type VaultData = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
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
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

function parseVault(raw: string): VaultData {
  const parsed: unknown = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid vault data.");
  }

  const data = parsed as Record<string, unknown>;

  if (
    data.version !== 1 ||
    typeof data.salt !== "string" ||
    typeof data.iv !== "string" ||
    typeof data.ciphertext !== "string"
  ) {
    throw new Error("Invalid vault format.");
  }

  return data as VaultData;
}

export function vaultExists(): boolean {
  return localStorage.getItem(SECRET_VAULT_KEY) !== null;
}

export function hasLegacyNotes(): boolean {
  return localStorage.getItem(LEGACY_NOTES_KEY) !== null;
}

export function loadLegacyNotes(): LittleNote[] {
  const raw = localStorage.getItem(LEGACY_NOTES_KEY);

  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Existing notes have an invalid format.");
  }

  return parsed as LittleNote[];
}

async function encryptNotes(
  notes: LittleNote[],
  password: string,
  salt?: Uint8Array<ArrayBuffer>
): Promise<VaultData> {
  const actualSalt = salt ?? randomBytes(16);
  const iv = randomBytes(12);

  const key = await deriveKey(password, actualSalt);

  const plaintext = encoder.encode(JSON.stringify(notes));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    plaintext
  );

  return {
    version: 1,
    salt: toBase64(actualSalt),
    iv: toBase64(new Uint8Array(encrypted.byteLength > 0 ? iv : iv)),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };
}

async function decryptNotes(
  data: VaultData,
  password: string
): Promise<LittleNote[]> {
  const salt = fromBase64(data.salt);
  const iv = fromBase64(data.iv);
  const ciphertext = fromBase64(data.ciphertext);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  );

  const parsed: unknown = JSON.parse(
    decoder.decode(decrypted)
  );

  if (!Array.isArray(parsed)) {
    throw new Error("Decrypted vault is invalid.");
  }

  return parsed as LittleNote[];
}

export async function createVault(
  password: string,
  notes: LittleNote[] = []
): Promise<void> {
  if (password.length < 12) {
    throw new Error(
      "Use a password with at least 12 characters."
    );
  }

  if (vaultExists()) {
    throw new Error("A private vault already exists.");
  }

  const encrypted = await encryptNotes(notes, password);

  // Verify encryption before storing anything.
  const verified = await decryptNotes(encrypted, password);

  if (JSON.stringify(verified) !== JSON.stringify(notes)) {
    throw new Error("Vault verification failed.");
  }

  localStorage.setItem(
    SECRET_VAULT_KEY,
    JSON.stringify(encrypted)
  );
}

export async function unlockVault(
  password: string
): Promise<LittleNote[]> {
  const raw = localStorage.getItem(SECRET_VAULT_KEY);

  if (!raw) {
    throw new Error("No private vault exists.");
  }

  try {
    return await decryptNotes(parseVault(raw), password);
  } catch {
    throw new Error(
      "Incorrect password or corrupted vault data."
    );
  }
}

export async function saveVaultNotes(
  notes: LittleNote[],
  password: string
): Promise<void> {
  const raw = localStorage.getItem(SECRET_VAULT_KEY);

  if (!raw) {
    throw new Error("Unlock or create your vault first.");
  }

  const current = parseVault(raw);

  // Verify the password before replacing encrypted data.
  await decryptNotes(current, password);

  const encrypted = await encryptNotes(
    notes,
    password,
    fromBase64(current.salt)
  );

  const verified = await decryptNotes(encrypted, password);

  if (JSON.stringify(verified) !== JSON.stringify(notes)) {
    throw new Error("Encrypted save verification failed.");
  }

  localStorage.setItem(
    SECRET_VAULT_KEY,
    JSON.stringify(encrypted)
  );
}

export async function migrateLegacyNotes(
  password: string
): Promise<LittleNote[]> {
  const legacyRaw = localStorage.getItem(LEGACY_NOTES_KEY);

  if (!legacyRaw) {
    return unlockVault(password);
  }

  const legacyNotes = loadLegacyNotes();

  if (!vaultExists()) {
    await createVault(password, legacyNotes);
  } else {
    const existingNotes = await unlockVault(password);

    const merged = [...existingNotes];
    const existingIds = new Set(
      existingNotes.map((note) => note.id)
    );

    for (const note of legacyNotes) {
      if (!existingIds.has(note.id)) {
        merged.push(note);
      }
    }

    await saveVaultNotes(merged, password);
  }

  const verified = await unlockVault(password);

  const verifiedIds = new Set(
    verified.map((note) => note.id)
  );

  const allMigrated = legacyNotes.every(
    (note) => verifiedIds.has(note.id)
  );

  if (!allMigrated) {
    throw new Error(
      "Migration verification failed. Original notes were preserved."
    );
  }

  // Only remove readable notes after encrypted verification.
  localStorage.removeItem(LEGACY_NOTES_KEY);

  return verified;
}
