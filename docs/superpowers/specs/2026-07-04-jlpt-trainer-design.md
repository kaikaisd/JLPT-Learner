# JLPT Trainer — Design Spec

Date: 2026-07-04
Status: Approved by user

## Goal

A Japanese-learning web app covering JLPT levels N5 through N1 with four study
modules per level — vocabulary, grammar, reading, and listening — that runs on
any platform (desktop, Android, iOS) and works fully offline after the first
visit.

## Architecture

- **Dependency-free static PWA.** Plain HTML/CSS/ES-module JavaScript. No
  build step, no framework, no node_modules. Deployable to any static host;
  runnable locally with any static file server.
- **Offline:** a service worker (`sw.js`) precaches the app shell and all
  data/JSON files on install (cache-first strategy, versioned cache name).
  `manifest.webmanifest` + icons make it installable on desktop and mobile.
- **Single-page app** with a tiny hash-based router (`#/n5/vocab`,
  `#/n3/listening/2`, …). One `index.html`; views rendered by JS modules.
- **Storage:** progress (learned words, quiz scores, exercise completion)
  persists in IndexedDB via a small promise wrapper. No accounts, no server.
- **Audio:** Web Speech API (`speechSynthesis`) with a `ja-JP` voice, with
  replay and speed control. If no Japanese voice is available the listening
  module falls back to showing the transcript with a notice.

## File layout

```
index.html            app shell
manifest.webmanifest  PWA manifest
sw.js                 service worker (precache, cache-first)
css/style.css         styles (responsive, light/dark)
js/app.js             bootstrap + router
js/store.js           IndexedDB progress store
js/data.js            lazy JSON loading + caching
js/tts.js             speechSynthesis wrapper (ja voice pick, rate)
js/views/*.js         home, level, vocab, grammar, reading, listening, quiz
data/vocab-n{1..5}.json
data/grammar-n{1..5}.json
data/reading-n{1..5}.json
data/listening-n{1..5}.json
icons/                PWA icons (SVG-derived PNGs)
```

## Content (per level)

All content is plain JSON, hand-editable and extensible.

- **Vocabulary** — from open JLPT word lists (JMdict-derived). Hundreds to
  thousands of entries per level: `{kanji, kana, meaning}`. Loaded lazily per
  level; precached for offline.
- **Grammar** — ~25–50 points per level (generated, JLPT-aligned):
  `{title, structure, explanation, examples: [{jp, reading, en}]}`.
- **Reading** — 5+ graded passages per level: `{title, body (with per-token
  furigana markup), en, questions: [{q, choices, answer}]}`. Furigana toggle.
- **Listening** — 5+ exercises per level: `{title, script (spoken via TTS),
  questions}`. Transcript hidden until answered.

## Features

- **Home / dashboard:** pick a level (N5–N1), see per-module progress bars.
- **Vocabulary:** searchable browser, flashcards (kanji → kana/meaning flip,
  mark known/unknown), multiple-choice quiz (word → meaning and reverse).
- **Grammar:** reference list with explanations and examples; fill-the-blank /
  multiple-choice quiz.
- **Reading:** passage with furigana toggle and translation toggle, then
  comprehension questions with scoring.
- **Listening:** play/replay script at adjustable speed, answer questions,
  then reveal transcript; scored.
- **Progress:** stored per level+module in IndexedDB; dashboard reflects it.
  Reset-progress option in settings.

## Error handling

- Missing/failed data file → view shows a friendly error, rest of app works.
- No Japanese TTS voice → listening shows transcript with a notice instead of
  silently failing.
- IndexedDB unavailable (private mode) → app still works; progress just
  doesn't persist (in-memory fallback).

## Verification

Run under a local static server; exercise every module in a preview browser:
navigation, flashcards, all quiz types, TTS playback, furigana toggle,
progress persistence across reload, and service-worker offline behavior.

## Out of scope (YAGNI)

Accounts/sync, spaced-repetition scheduling algorithms, handwriting/kanji
stroke practice, app-store packaging, server-side anything.
