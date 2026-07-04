import { MODULES, loadIndex } from '../data.js';
import { levelProgress } from '../progress.js';
import { el, crumbs, levelChip, progressBar } from '../ui.js';

export async function renderLevel(app, level) {
  app.append(
    crumbs(['Home', '#/'], [level.toUpperCase()]),
    el('h1', {}, levelChip(level), ` ${level.toUpperCase()} Study`),
    el('p', { class: 'sub' }, 'Choose a module.'),
  );

  const grid = el('div', { class: 'grid' });
  app.append(grid);

  let counts = null, prog = null;
  try {
    counts = await loadIndex();
    prog = await levelProgress(level, counts);
  } catch { /* cards still render without counts */ }

  for (const mod of MODULES) {
    const total = counts?.[level]?.[mod.id];
    const fraction = prog?.perModule[mod.id] ?? 0;
    grid.append(el('a', { class: 'card', href: `#/${level}/${mod.id}` },
      el('h3', {}, `${mod.icon} ${mod.label} `, el('span', { class: 'gp-structure', lang: 'ja' }, mod.jp)),
      el('p', { class: 'meta' }, total ? `${total} ${mod.id === 'vocab' ? 'words' : mod.id === 'grammar' ? 'points' : 'exercises'}` : ''),
      progressBar(fraction),
      el('p', { class: 'meta', style: 'margin:6px 0 0' }, `${Math.round(fraction * 100)}%`),
    ));
  }
}
