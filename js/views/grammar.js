import { loadGrammar } from '../data.js';
import * as store from '../store.js';
import { el, crumbs, levelChip, sample, runQuiz } from '../ui.js';

const QUIZ_LEN = 10;

export async function renderGrammar(app, level, rest) {
  if (rest[0] === 'quiz') return renderQuizView(app, level);
  return renderList(app, level);
}

async function renderList(app, level) {
  const { points } = await loadGrammar(level);
  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Grammar']),
    el('h1', {}, levelChip(level), ' Grammar'),
    el('p', { class: 'sub' }, `${points.length} grammar points. Tap a point to expand it.`),
    el('div', { class: 'btn-row' },
      el('a', { class: 'btn primary', href: `#/${level}/grammar/quiz` }, '❓ Grammar Quiz'),
    ),
  );

  for (const p of points) {
    const details = el('details', { class: 'gp' },
      el('summary', {},
        el('span', { class: 'gp-title', lang: 'ja' }, p.title),
        el('span', { class: 'gp-structure', lang: 'ja' }, p.structure),
      ),
      el('div', { class: 'gp-body' },
        el('p', {}, p.explanation),
        p.examples.map((ex) => el('div', { class: 'example' },
          el('div', { class: 'jp', lang: 'ja' }, ex.jp),
          el('div', { class: 'rd', lang: 'ja' }, ex.reading),
          el('div', { class: 'en' }, ex.en),
        )),
      ),
    );
    app.append(details);
  }
}

async function renderQuizView(app, level) {
  const { points } = await loadGrammar(level);
  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase(), `#/${level}`], ['Grammar', `#/${level}/grammar`], ['Quiz']),
    el('h1', {}, levelChip(level), ' Grammar Quiz'),
  );

  const pool = points.flatMap((p) => (p.quiz || []).map((q) => ({ ...q, point: p.title })));
  const questions = sample(pool, Math.min(QUIZ_LEN, pool.length))
    .map((q) => ({ ...q, en: q.en ? `${q.en}  (${q.point})` : q.point }));

  const quizBox = el('div');
  app.append(quizBox);
  runQuiz(quizBox, questions, {
    title: 'Grammar',
    backHref: `#/${level}/grammar`,
    onFinish: (score, total) => store.saveQuizScore(level, 'grammar', score, total),
  });
}
