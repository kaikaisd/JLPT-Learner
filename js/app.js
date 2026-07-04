// Bootstrap + hash router. Routes:
//   #/                     home (level picker)
//   #/settings             settings
//   #/<level>              level dashboard        (level = n5..n1)
//   #/<level>/<module>     module hub / list
//   #/<level>/<module>/<rest...>  module sub-view (flashcards, quiz, item id)

import { LEVELS } from './data.js';
import * as tts from './tts.js';
import { renderHome } from './views/home.js';
import { renderSettings } from './views/settings.js';
import { renderLevel } from './views/level.js';
import { renderVocab } from './views/vocab.js';
import { renderGrammar } from './views/grammar.js';
import { renderReading } from './views/reading.js';
import { renderListening } from './views/listening.js';
import { errorNotice } from './ui.js';

const app = document.getElementById('app');

const moduleViews = {
  vocab: renderVocab,
  grammar: renderGrammar,
  reading: renderReading,
  listening: renderListening,
};

async function route() {
  tts.stop(); // never carry audio across navigation
  const hash = location.hash.replace(/^#\/?/, '');
  const [first, second, ...rest] = hash.split('/').filter(Boolean);
  app.replaceChildren();
  window.scrollTo(0, 0);

  try {
    if (!first) return await renderHome(app);
    if (first === 'settings') return await renderSettings(app);
    if (LEVELS.includes(first)) {
      if (!second) return await renderLevel(app, first);
      const view = moduleViews[second];
      if (view) return await view(app, first, rest);
    }
    app.append(errorNotice('Page not found.'), backHome());
  } catch (err) {
    console.error(err);
    app.replaceChildren(
      errorNotice(`Something went wrong loading this page: ${err.message}`),
      backHome(),
    );
  }
}

function backHome() {
  const a = document.createElement('a');
  a.href = '#/';
  a.className = 'btn';
  a.style.marginTop = '14px';
  a.textContent = '← Home';
  return a;
}

function updateOfflineBadge() {
  document.getElementById('offline-badge')?.classList.toggle('hidden', navigator.onLine);
}

window.addEventListener('hashchange', route);
window.addEventListener('online', updateOfflineBadge);
window.addEventListener('offline', updateOfflineBadge);

tts.init();
updateOfflineBadge();
route();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.warn('Service worker registration failed (offline mode unavailable):', err);
  });
}
