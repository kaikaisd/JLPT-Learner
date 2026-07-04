import * as store from '../store.js';
import * as tts from '../tts.js';
import { el, crumbs } from '../ui.js';

export async function renderSettings(app) {
  const settings = await store.getSettings();

  app.append(
    crumbs(['Home', '#/'], ['Settings']),
    el('h1', {}, 'Settings'),
  );

  // Furigana default
  const furiToggle = el('input', {
    type: 'checkbox',
    onchange: () => store.saveSettings({ furigana: furiToggle.checked }),
  });
  furiToggle.checked = settings.furigana;
  app.append(settingRow('Furigana by default', 'Show kana readings above kanji in reading passages',
    el('label', { class: 'switch' }, furiToggle, el('i'))));

  // Speech rate
  const rateOut = el('span', { class: 'meta' }, `${settings.rate}×`);
  const rate = el('input', {
    type: 'range', min: '0.5', max: '1.5', step: '0.25', value: settings.rate,
    oninput: () => { rateOut.textContent = `${rate.value}×`; },
    onchange: () => store.saveSettings({ rate: parseFloat(rate.value) }),
  });
  app.append(settingRow('Speech speed', 'Default speed for listening exercises and read-aloud',
    el('span', {}, rate, ' ', rateOut)));

  // Voice picker
  const voices = tts.japaneseVoices();
  if (voices.length) {
    const sel = el('select', { onchange: () => store.saveSettings({ voiceURI: sel.value }) },
      ...voices.map((v) => {
        const opt = el('option', { value: v.voiceURI }, `${v.name}${v.localService ? ' (offline)' : ' (online)'}`);
        if (v.voiceURI === settings.voiceURI) opt.selected = true;
        return opt;
      }));
    app.append(settingRow('Japanese voice', 'Voice used for listening and read-aloud', sel));
  } else {
    app.append(el('p', { class: 'notice' },
      '🔇 No Japanese text-to-speech voice found. Listening exercises will show transcripts instead. ',
      'On Windows: Settings → Time & Language → Speech → Add voices → Japanese. On Android/iOS, install a Japanese voice in system settings.'));
  }

  // Test voice
  if (voices.length) {
    app.append(settingRow('Test the voice', 'こんにちは、日本語の練習をしましょう！',
      el('button', {
        class: 'btn',
        onclick: async (e) => {
          const s = await store.getSettings();
          e.target.disabled = true;
          await tts.speak('こんにちは。日本語の練習をしましょう。', { rate: s.rate, voiceURI: s.voiceURI });
          e.target.disabled = false;
        },
      }, '🔊 Play')));
  }

  // Reset progress
  const resetBtn = el('button', { class: 'btn', style: 'border-color:var(--bad);color:var(--bad)', onclick: reset }, 'Reset');
  app.append(settingRow('Reset all progress', 'Clears known words, quiz scores and completed exercises on this device', resetBtn));
  let armed = false;
  async function reset() {
    if (!armed) { armed = true; resetBtn.textContent = 'Tap again to confirm'; return; }
    await store.clearAll();
    resetBtn.textContent = 'Progress cleared ✓';
    resetBtn.disabled = true;
  }

  app.append(el('p', { class: 'sub', style: 'margin-top:26px' },
    'JLPT Trainer — works fully offline once loaded. Vocabulary data derived from open JLPT word lists (JMdict/EDICT, CC-BY-SA).'));
}

function settingRow(label, desc, control) {
  return el('div', { class: 'setting-row' },
    el('div', {}, el('label', {}, label), el('span', { class: 'desc' }, desc)),
    control,
  );
}
