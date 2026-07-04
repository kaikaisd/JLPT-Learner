// Japanese text-to-speech via the Web Speech API.
// Long texts are split into sentences and queued — several engines cut off
// long single utterances.

let voices = [];

function refreshVoices() {
  try { voices = speechSynthesis.getVoices() || []; } catch { voices = []; }
}

export function init() {
  if (!('speechSynthesis' in window)) return;
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  // Some browsers only populate the list after a tick.
  setTimeout(refreshVoices, 300);
}

export function japaneseVoices() {
  refreshVoices();
  return voices.filter((v) => (v.lang || '').toLowerCase().startsWith('ja'));
}

export function hasJapaneseVoice() {
  return japaneseVoices().length > 0;
}

function pickVoice(preferredURI) {
  const ja = japaneseVoices();
  if (!ja.length) return null;
  if (preferredURI) {
    const found = ja.find((v) => v.voiceURI === preferredURI);
    if (found) return found;
  }
  // Prefer an offline-capable (local) voice.
  return ja.find((v) => v.localService) || ja[0];
}

function splitSentences(text) {
  return text
    .replace(/\n+/g, '。')
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Speak `text`; resolves when finished or cancelled.
// onStateChange('speaking' | 'idle') drives play-button UI.
export function speak(text, { rate = 1, voiceURI = null, onStateChange } = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve(false);
  stop();
  const voice = pickVoice(voiceURI);
  const parts = splitSentences(text);
  if (!parts.length) return Promise.resolve(false);

  onStateChange?.('speaking');
  return new Promise((resolve) => {
    let remaining = parts.length;
    let cancelled = false;
    const finish = () => {
      if (--remaining <= 0 || cancelled) {
        onStateChange?.('idle');
        resolve(!cancelled);
      }
    };
    for (const part of parts) {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = 'ja-JP';
      if (voice) u.voice = voice;
      u.rate = rate;
      u.onend = finish;
      u.onerror = () => { cancelled = true; onStateChange?.('idle'); resolve(false); };
      speechSynthesis.speak(u);
    }
  });
}

export function stop() {
  try { speechSynthesis.cancel(); } catch { /* no speech support */ }
}

export function isSpeaking() {
  try { return speechSynthesis.speaking; } catch { return false; }
}
