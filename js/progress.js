// Per-level / per-module progress fractions for dashboards.
// counts comes from data/index.json: { n5: {vocab, grammar, reading, listening}, ... }

import * as store from './store.js';

export async function moduleProgress(level, module, counts) {
  const total = counts?.[level]?.[module] || 0;
  if (!total) return 0;
  switch (module) {
    case 'vocab':
      return (await store.countKnown(level)) / total;
    case 'grammar': {
      const best = await store.getQuizBest(level, 'grammar');
      return best ? best.score / best.total : 0;
    }
    case 'reading':
    case 'listening':
      return (await store.countDone(level, module)) / total;
    default:
      return 0;
  }
}

export async function levelProgress(level, counts) {
  const modules = ['vocab', 'grammar', 'reading', 'listening'];
  const fractions = await Promise.all(modules.map((m) => moduleProgress(level, m, counts)));
  const sum = fractions.reduce((a, b) => a + b, 0);
  return { perModule: Object.fromEntries(modules.map((m, i) => [m, fractions[i]])), overall: sum / modules.length };
}
