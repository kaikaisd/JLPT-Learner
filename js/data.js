// Lazy loading + in-memory caching of the per-level JSON data files.

const cache = new Map();

export const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'];
export const MODULES = [
  { id: 'vocab', label: 'Vocabulary', jp: '語彙', icon: '📖' },
  { id: 'grammar', label: 'Grammar', jp: '文法', icon: '✏️' },
  { id: 'reading', label: 'Reading', jp: '読解', icon: '📰' },
  { id: 'listening', label: 'Listening', jp: '聴解', icon: '🎧' },
];

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  const json = await res.json();
  cache.set(path, json);
  return json;
}

export const loadIndex = () => fetchJSON('data/index.json');
export const loadVocab = (level) => fetchJSON(`data/vocab-${level}.json`);
export const loadGrammar = (level) => fetchJSON(`data/grammar-${level}.json`);
export const loadReading = (level) => fetchJSON(`data/reading-${level}.json`);
export const loadListening = (level) => fetchJSON(`data/listening-${level}.json`);

export function load(module, level) {
  switch (module) {
    case 'vocab': return loadVocab(level);
    case 'grammar': return loadGrammar(level);
    case 'reading': return loadReading(level);
    case 'listening': return loadListening(level);
    default: return Promise.reject(new Error(`Unknown module ${module}`));
  }
}
