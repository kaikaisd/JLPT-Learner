import { LEVELS, loadIndex } from '../data.js';
import { levelProgress } from '../progress.js';
import { el, levelChip, progressBar } from '../ui.js';

const LEVEL_DESC = {
  n5: 'Beginner — basic phrases and everyday expressions',
  n4: 'Elementary — familiar daily topics',
  n3: 'Intermediate — everyday situations with some depth',
  n2: 'Upper intermediate — newspapers and natural conversation',
  n1: 'Advanced — complex and abstract Japanese',
};

export async function renderHome(app) {
  app.append(
    el('h1', {}, 'こんにちは！'),
    el('p', { class: 'sub' }, 'Pick a JLPT level to study vocabulary, grammar, reading and listening. Everything works offline.'),
  );

  const grid = el('div', { class: 'grid' });
  app.append(grid);

  let counts = null;
  try { counts = await loadIndex(); } catch { /* progress bars stay empty */ }

  for (const level of LEVELS) {
    const card = el('a', { class: 'card', href: `#/${level}` },
      el('h3', {}, levelChip(level), ' ', level === 'n5' ? 'Start here' : ''),
      el('p', { class: 'meta' }, LEVEL_DESC[level]),
    );
    grid.append(card);
    if (counts) {
      levelProgress(level, counts).then(({ overall }) => {
        card.append(
          progressBar(overall),
          el('p', { class: 'meta', style: 'margin:6px 0 0' }, `${Math.round(overall * 100)}% complete`),
        );
      });
    }
  }
}
