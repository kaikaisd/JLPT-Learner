import { loadListening } from '../data.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import { el, crumbs, levelChip, errorNotice, runQuiz } from '../ui.js';

export async function renderListening(app, level, rest) {
  if (rest[0]) return renderExercise(app, level, rest[0]);
  return renderList(app, level);
}

async function renderList(app, level) {
  const { exercises } = await loadListening(level);
  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Listening']),
    el('h1', {}, levelChip(level), ' Listening'),
    el('p', { class: 'sub' }, `${exercises.length} exercises. Listen, then answer — the transcript unlocks afterwards.`),
  );
  const grid = el('div', { class: 'grid' });
  app.append(grid);
  for (const ex of exercises) {
    const card = el('a', { class: 'card', href: `#/${level}/listening/${ex.id}` },
      el('h3', { lang: 'ja' }, ex.title),
      el('p', { class: 'meta' }, `${ex.questions.length} questions`),
    );
    grid.append(card);
    store.getDone(level, 'listening', ex.id).then((done) => {
      if (done) card.append(el('p', { class: 'done-tag' }, `✓ completed ${done.score}/${done.total}`));
    });
  }
}

async function renderExercise(app, level, id) {
  const { exercises } = await loadListening(level);
  const ex = exercises.find((e) => e.id === id);
  if (!ex) { app.append(errorNotice('Exercise not found.')); return; }

  const settings = await store.getSettings();
  const voiceOk = tts.hasJapaneseVoice();

  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Listening', `#/${level}/listening`], [ex.title]),
    el('h1', { lang: 'ja' }, ex.title),
  );

  const panel = el('div', { class: 'listen-panel' });
  app.append(panel);

  const transcript = el('div', { class: 'transcript hidden' },
    el('p', { lang: 'ja' }, ex.script),
    el('p', { class: 'quiz-explain' }, ex.en),
  );
  const transcriptBtn = el('button', { class: 'btn hidden', onclick: () => transcript.classList.toggle('hidden') }, '📝 Transcript');

  if (!voiceOk) {
    // Graceful fallback: no Japanese TTS voice — practice as reading instead.
    panel.append(
      el('p', { class: 'notice', style: 'text-align:left' },
        '🔇 No Japanese text-to-speech voice is installed on this device, so the audio can\'t be played. ',
        'You can still read the transcript below and answer the questions. ',
        '(On Windows: Settings → Time & Language → Speech → Add voices → Japanese.)'),
    );
    transcript.classList.remove('hidden');
    panel.append(transcript);
  } else {
    let rate = settings.rate;
    let playing = false;
    const playBtn = el('button', { class: 'play-btn', 'aria-label': 'Play audio', onclick: toggle }, '▶');
    const status = el('p', { class: 'meta', style: 'margin:12px 0 0' }, 'Tap to listen');
    const speed = el('select', { onchange: () => { rate = parseFloat(speed.value); } },
      ...[0.75, 1, 1.25].map((r) => {
        const opt = el('option', { value: r }, `${r}× speed`);
        if (r === rate) opt.selected = true;
        return opt;
      }),
    );

    function toggle() {
      if (playing) { tts.stop(); setIdle(); return; }
      playing = true;
      playBtn.textContent = '⏹';
      status.textContent = 'Playing…';
      tts.speak(ex.script, {
        rate,
        voiceURI: settings.voiceURI,
        onStateChange: (s) => { if (s === 'idle') setIdle(true); },
      });
    }
    function setIdle(finished = false) {
      playing = false;
      playBtn.textContent = '▶';
      status.textContent = finished ? 'Play again, or answer the questions below.' : 'Tap to listen';
      transcriptBtn.classList.remove('hidden');
    }

    panel.append(playBtn, status, el('div', { class: 'listen-controls' }, speed, transcriptBtn), transcript);
  }

  app.append(el('h2', {}, 'Questions'));
  const quizBox = el('div');
  app.append(quizBox);
  runQuiz(quizBox, ex.questions, {
    title: ex.title,
    backHref: `#/${level}/listening`,
    onFinish: (score, total) => {
      store.markDone(level, 'listening', ex.id, score, total);
      transcriptBtn.classList.remove('hidden');
      transcript.classList.remove('hidden');
    },
  });
}
