// Progress + settings persistence on IndexedDB, with an in-memory fallback
// (private browsing modes can block IndexedDB entirely).

const DB_NAME = 'jlpt-trainer';
const STORE = 'kv';
let dbPromise = null;
const memory = new Map();
let useMemory = false;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      useMemory = true;
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { useMemory = true; resolve(null); };
  });
  return dbPromise;
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export async function get(key) {
  const db = await openDB();
  if (useMemory || !db) return memory.get(key);
  return new Promise((resolve) => {
    const req = tx(db, 'readonly').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
}

export async function set(key, value) {
  const db = await openDB();
  if (useMemory || !db) { memory.set(key, value); return; }
  return new Promise((resolve) => {
    const req = tx(db, 'readwrite').put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => { memory.set(key, value); resolve(); };
  });
}

export async function del(key) {
  const db = await openDB();
  if (useMemory || !db) { memory.delete(key); return; }
  return new Promise((resolve) => {
    const req = tx(db, 'readwrite').delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

// All keys beginning with `prefix`.
export async function keysWithPrefix(prefix) {
  const db = await openDB();
  if (useMemory || !db) return [...memory.keys()].filter((k) => k.startsWith(prefix));
  return new Promise((resolve) => {
    const range = IDBKeyRange.bound(prefix, prefix + '￿');
    const req = tx(db, 'readonly').getAllKeys(range);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function clearAll() {
  const db = await openDB();
  memory.clear();
  if (useMemory || !db) return;
  return new Promise((resolve) => {
    const req = tx(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

// ---- domain helpers ----

const SETTINGS_KEY = 'settings';
const defaultSettings = { furigana: true, rate: 1 };

export async function getSettings() {
  return { ...defaultSettings, ...(await get(SETTINGS_KEY) || {}) };
}
export async function saveSettings(patch) {
  const s = { ...(await getSettings()), ...patch };
  await set(SETTINGS_KEY, s);
  return s;
}

export const knownKey = (level, word) => `known:${level}:${word.k}|${word.r}`;

export async function countKnown(level) {
  return (await keysWithPrefix(`known:${level}:`)).length;
}

// Completion of one reading/listening exercise: key done:<level>:<module>:<id>
export async function markDone(level, module, id, score, total) {
  await set(`done:${level}:${module}:${id}`, { score, total, at: Date.now() });
}
export async function countDone(level, module) {
  return (await keysWithPrefix(`done:${level}:${module}:`)).length;
}
export async function getDone(level, module, id) {
  return get(`done:${level}:${module}:${id}`);
}

// Best quiz score per level+module: key quizbest:<level>:<module>
export async function saveQuizScore(level, module, score, total) {
  const key = `quizbest:${level}:${module}`;
  const prev = await get(key);
  if (!prev || score / total > prev.score / prev.total) {
    await set(key, { score, total, at: Date.now() });
  }
}
export async function getQuizBest(level, module) {
  return get(`quizbest:${level}:${module}`);
}
