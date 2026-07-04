import { loadVocab } from '../data.js';
import * as store from '../store.js';
import { el, crumbs, levelChip, errorNotice, shuffle, sample, runQuiz } from '../ui.js';

const PAGE = 50;
const SESSION = 20; // flashcards per round
const QUIZ_LEN = 10;

export async function renderVocab(app, level, rest) {
  const sub = rest[0];
  if (sub === 'flashcards') return renderFlashcards(app, level);
  if (sub === 'quiz') return renderQuiz(app, level);
  return renderBrowser(app, level);
}

/* ---------- browser ---------- */

async function renderBrowser(app, level) {
  const { words } = await loadVocab(level);
  const knownKeys = new Set(await store.keysWithPrefix(`known:${level}:`));
  const knownCount = knownKeys.size;

  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Vocabulary']),
    el('h1', {}, levelChip(level), ' Vocabulary'),
    el('p', { class: 'sub' }, `${words.length} words — ${knownCount} marked as known.`),
    el('div', { class: 'btn-row' },
      el('a', { class: 'btn primary', href: `#/${level}/vocab/flashcards` }, '🃏 Flashcards'),
      el('a', { class: 'btn', href: `#/${level}/vocab/quiz` }, '❓ Quiz'),
    ),
  );

  const search = el('input', { class: 'search', type: 'search', placeholder: 'Search kanji, reading or meaning…' });
  const list = el('ul', { class: 'word-list' });
  const moreBtn = el('button', { class: 'btn', style: 'margin-top:10px' }, 'Show more');
  app.append(search, list, moreBtn);

  let filtered = words;
  let shown = 0;

  function renderMore(reset = false) {
    if (reset) { list.replaceChildren(); shown = 0; }
    const slice = filtered.slice(shown, shown + PAGE);
    shown += slice.length;
    for (const w of slice) {
      const isKnown = knownKeys.has(store.knownKey(level, w));
      list.append(el('li', {},
        el('span', { class: `word-known${isKnown ? ' on' : ''}`, title: isKnown ? 'known' : 'not learned yet' }),
        el('span', { class: 'word-k', lang: 'ja' }, w.k),
        el('span', { class: 'word-r', lang: 'ja' }, w.r),
        el('span', { class: 'word-m' }, w.m),
      ));
    }
    moreBtn.classList.toggle('hidden', shown >= filtered.length);
  }

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    filtered = q ? words.filter((w) => w.k.includes(q) || w.r.includes(q) || w.m.toLowerCase().includes(q)) : words;
    renderMore(true);
  });
  moreBtn.addEventListener('click', () => renderMore());
  renderMore();
}

/* ---------- flashcards ---------- */

async function renderFlashcards(app, level) {
  const { words } = await loadVocab(level);
  const knownKeys = new Set(await store.keysWithPrefix(`known:${level}:`));

  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Vocabulary', `#/${level}/vocab`], ['Flashcards']),
    el('h1', {}, levelChip(level), ' Flashcards'),
  );

  const unknown = words.filter((w) => !knownKeys.has(store.knownKey(level, w)));
  if (!unknown.length) {
    app.append(el('p', { class: 'notice' }, '🎉 You have marked every word in this level as known! Reset progress in Settings to start over.'));
    return;
  }

  const deck = sample(unknown, SESSION);
  const wrap = el('div', { class: 'flash-wrap' });
  app.append(wrap);
  let i = 0, learned = 0;

  function showCard() {
    const w = deck[i];
    let flipped = false;
    wrap.replaceChildren(
      el('p', { class: 'flash-count' }, `Card ${i + 1} / ${deck.length} · ${unknown.length - learned} words left to learn`),
    );
    const card = el('div', { class: 'flash-card', onclick: flip },
      el('span', { class: 'flash-front', lang: 'ja' }, w.k),
      el('span', { class: 'flash-hint' }, 'tap to reveal'),
    );
    const actions = el('div', { class: 'flash-actions hidden' },
      el('button', { class: 'btn dont', onclick: () => nextCard(false) }, 'まだ Still learning'),
      el('button', { class: 'btn know', onclick: () => nextCard(true) }, '知ってる I know it'),
    );
    wrap.append(card, actions);

    function flip() {
      if (flipped) return;
      flipped = true;
      card.replaceChildren(
        el('span', { class: 'flash-front', lang: 'ja' }, w.k),
        el('span', { class: 'flash-reading', lang: 'ja' }, w.r),
        el('span', { class: 'flash-meaning' }, w.m),
      );
      actions.classList.remove('hidden');
    }

    async function nextCard(known) {
      if (known) {
        learned++;
        await store.set(store.knownKey(level, w), { at: Date.now() });
      }
      i++;
      if (i < deck.length) showCard();
      else finish();
    }
  }

  function finish() {
    wrap.replaceChildren(el('div', { class: 'quiz-q quiz-result' },
      el('p', {}, 'Session complete!'),
      el('p', { class: 'quiz-score' }, `+${learned}`),
      el('p', { class: 'meta' }, `${learned} word${learned === 1 ? '' : 's'} marked as known this round.`),
      el('div', { class: 'btn-row', style: 'justify-content:center' },
        el('button', { class: 'btn primary', onclick: () => renderVocab(clearApp(app), level, ['flashcards']) }, '↻ New round'),
        el('a', { class: 'btn', href: `#/${level}/vocab` }, 'Done'),
      ),
    ));
  }

  showCard();
}

function clearApp(app) {
  app.replaceChildren();
  return app;
}

/* ---------- quiz ---------- */

async function renderQuiz(app, level) {
  const { words } = await loadVocab(level);
  if (words.length < 8) {
    app.append(errorNotice('Not enough vocabulary for a quiz.'));
    return;
  }

  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Vocabulary', `#/${level}/vocab`], ['Quiz']),
    el('h1', {}, levelChip(level), ' Vocabulary Quiz'),
  );

  const picked = sample(words, QUIZ_LEN);
  const questions = picked.map((w, i) => {
    const distractors = sample(words.filter((x) => x.m !== w.m), 3);
    if (i % 2 === 0) {
      // word → meaning
      return {
        q: `${w.k}（${w.r}）`,
        choices: [w.m, ...distractors.map((d) => d.m)],
        answer: 0,
        en: `${w.k} = ${w.m}`,
      };
    }
    // meaning → word
    return {
      q: `Which word means: “${w.m}”?`,
      choices: [`${w.k}（${w.r}）`, ...distractors.map((d) => `${d.k}（${d.r}）`)],
      answer: 0,
      en: `${w.m} = ${w.k}（${w.r}）`,
    };
  });

  const quizBox = el('div');
  app.append(quizBox);
  runQuiz(quizBox, questions, {
    title: 'Vocabulary',
    backHref: `#/${level}/vocab`,
    onFinish: (score, total) => store.saveQuizScore(level, 'vocab', score, total),
  });
}
