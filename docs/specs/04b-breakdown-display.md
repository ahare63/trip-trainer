# Character and word breakdowns: display

- **Suggested model:** Haiku 5.5
- **Depends on:** 04a
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Show the breakdown data from 04a on the answer side of cards.

## What to build

- A row under the native text: each chunk above its gloss, wrapping as needed; `lit` on its own line when present.
- For Korean cards, a “show letters” toggle that splits each Hangul block into its letters using `INIT`, `MED` and the final-consonant table from `js/data/hangul.js` (arithmetic on the code point; no new data).
- Used in `js/views/study.js` (answer side only) and available on demand in `js/views/phrasebook.js`.

## Done when

- Never visible before the answer is shown.
- Chunks carry the right `lang` attribute; glosses do not.
- Wraps cleanly at 380 px wide; no horizontal scrolling.
- Cards without an entry look exactly as they do now.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Editing the data files from 04a.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
