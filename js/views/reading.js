import { loadReading } from '../data.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import { el, crumbs, levelChip, errorNotice, runQuiz } from '../ui.js';

export async function renderReading(app, level, rest) {
  if (rest[0]) return renderPassage(app, level, rest[0]);
  return renderList(app, level);
}

async function renderList(app, level) {
  const { passages } = await loadReading(level);
  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Reading']),
    el('h1', {}, levelChip(level), ' Reading'),
    el('p', { class: 'sub' }, `${passages.length} graded passages with comprehension questions.`),
  );
  const grid = el('div', { class: 'grid' });
  app.append(grid);
  for (const p of passages) {
    const card = el('a', { class: 'card', href: `#/${level}/reading/${p.id}` },
      el('h3', { lang: 'ja' }, p.title),
      el('p', { class: 'meta' }, `${p.questions.length} questions`),
    );
    grid.append(card);
    store.getDone(level, 'reading', p.id).then((done) => {
      if (done) card.append(el('p', { class: 'done-tag' }, `✓ completed ${done.score}/${done.total}`));
    });
  }
}

// body tokens → DOM; [text, reading] pairs become <ruby>
function renderBody(body) {
  const frag = document.createDocumentFragment();
  for (const token of body) {
    if (Array.isArray(token)) {
      const ruby = el('ruby', {}, token[0], el('rt', {}, token[1]));
      frag.append(ruby);
    } else {
      frag.append(token);
    }
  }
  return frag;
}

const plainText = (body) => body.map((t) => (Array.isArray(t) ? t[0] : t)).join('');

async function renderPassage(app, level, id) {
  const { passages } = await loadReading(level);
  const passage = passages.find((p) => p.id === id);
  if (!passage) { app.append(errorNotice('Passage not found.')); return; }

  const settings = await store.getSettings();

  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Reading', `#/${level}/reading`], [passage.title]),
    el('h1', { lang: 'ja' }, passage.title),
  );

  const body = el('div', { class: `passage${settings.furigana ? '' : ' no-furi'}`, lang: 'ja' }, renderBody(passage.body));
  const translation = el('div', { class: 'notice translation hidden' }, passage.en);

  let speaking = false;
  const listenBtn = el('button', { class: 'btn', onclick: toggleSpeech }, '🔊 Read aloud');
  function toggleSpeech() {
    if (speaking) { tts.stop(); speaking = false; listenBtn.textContent = '🔊 Read aloud'; return; }
    if (!tts.hasJapaneseVoice()) { listenBtn.textContent = '🔇 No Japanese voice installed'; listenBtn.disabled = true; return; }
    speaking = true;
    listenBtn.textContent = '⏹ Stop';
    tts.speak(plainText(passage.body), {
      rate: settings.rate,
      voiceURI: settings.voiceURI,
      onStateChange: (s) => { if (s === 'idle') { speaking = false; listenBtn.textContent = '🔊 Read aloud'; } },
    });
  }

  app.append(
    el('div', { class: 'btn-row' },
      el('button', {
        class: 'btn',
        onclick: (e) => {
          const on = body.classList.toggle('no-furi');
          e.currentTarget.textContent = on ? 'ふりがな On' : 'ふりがな Off';
        },
      }, settings.furigana ? 'ふりがな Off' : 'ふりがな On'),
      el('button', {
        class: 'btn',
        onclick: () => translation.classList.toggle('hidden'),
      }, '🌐 Translation'),
      listenBtn,
    ),
    body,
    translation,
    el('h2', {}, 'Questions'),
  );

  const quizBox = el('div');
  app.append(quizBox);
  runQuiz(quizBox, passage.questions, {
    title: passage.title,
    backHref: `#/${level}/reading`,
    onFinish: (score, total) => store.markDone(level, 'reading', passage.id, score, total),
  });
}
