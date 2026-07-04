# JLPT Trainer 日

An offline-first Japanese learning web app covering **JLPT N5 → N1**, with four
study modules per level:

- **Vocabulary (語彙)** — 8,000+ words from open JLPT lists: browser with search,
  flashcards, and quizzes (word→meaning and meaning→word).
- **Grammar (文法)** — 170 grammar points with structure, explanation, examples,
  and fill-in-the-blank quizzes.
- **Reading (読解)** — graded passages with toggleable furigana, translation,
  read-aloud, and comprehension questions.
- **Listening (聴解)** — exercises spoken by your device's Japanese
  text-to-speech voice, with speed control and post-answer transcripts.

Progress (known words, quiz scores, completed exercises) is stored locally in
IndexedDB — no account, no server.

## Multi-platform & offline

It's a **PWA**: open it once in a browser and a service worker caches the whole
app + all data, so it keeps working with no connection. Install it to your home
screen (Android/iOS) or as a desktop app (Chrome/Edge "Install app") for a
native-like experience.

## Running it

Any static file server works. For example:

```sh
npx http-server -p 8123 .
# or
python -m http.server 8123
```

Then open http://localhost:8123. (Service workers require `localhost` or HTTPS.)

## Listening audio

Listening uses the Web Speech API with a Japanese voice installed on the
device. On Windows: *Settings → Time & Language → Speech → Add voices →
Japanese*. If no Japanese voice is available, exercises gracefully fall back to
showing the transcript.

## Data

All content lives in `data/*.json` and is hand-editable:

- `vocab-*.json` — `{k, r, m}` (kanji, reading, meaning), derived from
  [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks)
  (JMdict/EDICT-based, CC-BY-SA).
- `grammar-*.json` — points with examples and quiz items.
- `reading-*.json` — passages tokenized as `["kana", ["漢字", "かんじ"], …]`
  for furigana rendering.
- `listening-*.json` — TTS scripts with comprehension questions.
- `index.json` — per-level item counts for the dashboards.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
Vocabulary data is derived from JMdict/EDICT-based open JLPT lists (CC-BY-SA).
