// Small DOM helpers + the shared quiz runner used by every module.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

export function crumbs(...parts) {
  const p = el('p', { class: 'crumbs' });
  parts.forEach(([label, href], i) => {
    if (i) p.append(' › ');
    p.append(href ? el('a', { href }, label) : label);
  });
  return p;
}

export function errorNotice(message) {
  return el('p', { class: 'notice' }, `⚠ ${message}`);
}

export function levelChip(level) {
  return el('span', { class: `level-chip lv-${level}` }, level.toUpperCase());
}

export function progressBar(fraction) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return el('div', { class: 'bar' }, el('i', { style: `width:${pct}%` }));
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

/**
 * Shared quiz runner.
 * questions: [{q, choices: [..4], answer: idx, en?}]
 * opts.onFinish(score, total) — called once at the results screen.
 * opts.title — heading shown above questions.
 * Choices are shuffled per question; `answer` indexes the original array.
 */
export function runQuiz(container, questions, opts = {}) {
  let idx = 0;
  let score = 0;

  function showQuestion() {
    const q = questions[idx];
    container.replaceChildren();
    const box = el('div', { class: 'quiz-q' });
    box.append(el('p', { class: 'quiz-progress' }, `${opts.title || 'Quiz'} — Question ${idx + 1} / ${questions.length}`));
    box.append(el('p', { class: 'quiz-prompt', lang: 'ja' }, q.q));
    const order = shuffle(q.choices.map((_, i) => i));
    const list = el('div', { class: 'choices' });
    const buttons = order.map((origIdx) => {
      const btn = el('button', {
        class: 'choice',
        lang: 'ja',
        onclick: () => pick(origIdx, btn),
      }, q.choices[origIdx]);
      return btn;
    });
    buttons.forEach((b) => list.append(b));
    box.append(list);
    container.append(box);

    function pick(origIdx, btn) {
      const correct = origIdx === q.answer;
      if (correct) score++;
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (order[i] === q.answer) b.classList.add('correct');
      });
      if (!correct) btn.classList.add('wrong');
      if (q.en) box.append(el('p', { class: 'quiz-explain' }, `→ ${q.en}`));
      box.append(el('div', { class: 'btn-row' },
        el('button', { class: 'btn primary', onclick: next },
          idx + 1 < questions.length ? 'Next →' : 'See results')));
    }
  }

  function next() {
    idx++;
    if (idx < questions.length) showQuestion();
    else showResults();
  }

  function showResults() {
    container.replaceChildren();
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct === 100 ? '満点！ Perfect!' : pct >= 80 ? 'よくできました！ Great job!' : pct >= 60 ? 'まずまず！ Not bad!' : 'もう一度！ Keep practicing!';
    container.append(el('div', { class: 'quiz-q quiz-result' },
      el('p', {}, grade),
      el('p', { class: 'quiz-score' }, `${score} / ${questions.length}`),
      el('div', { class: 'btn-row', style: 'justify-content:center' },
        el('button', { class: 'btn', onclick: () => { idx = 0; score = 0; showQuestion(); } }, '↻ Retry'),
        opts.backHref ? el('a', { class: 'btn primary', href: opts.backHref }, 'Done') : null,
      ),
    ));
    opts.onFinish?.(score, questions.length);
  }

  showQuestion();
}
