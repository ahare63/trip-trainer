# Tone contours on Mandarin cards

- **Suggested model:** Haiku 5.5 (move to Sonnet 5.5 if the syllable check below cannot be made to pass)
- **Depends on:** None
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Draw the pitch shape of each syllable next to the pinyin on Taiwan cards, so tones are visible as well as audible.

## What to build

- New file `js/tones.js` with `toneMarks(rom)`: returns an array with one number per syllable, 1 to 4 for the marked tones and 0 for a toneless syllable. It reads the tone from the diacritic on the vowel (macron 1, acute 2, caron 3, grave 4).
- `toneSVG(tones)`: returns one small inline SVG: flat high line (1), rising (2), low dip (3), falling (4), short dot (0). Reuse the shapes already drawn in the “Mandarin tones” section of `js/views/scripts.js`.
- Show it under the romanization for `c === "tw"` cards on the answer side in `js/views/study.js`, and in `js/views/phrasebook.js` and `js/views/essentials.js`.
- Draw tones exactly as written in `rom`. Tone changes are already reflected there (for example `bú shì`).

## Done when

- Add to `tools/validate.js`: for every Taiwan card, the number of syllables from `toneMarks(rom)` equals the number of Chinese characters in `nat`. This must pass for all cards with no exceptions list.
- SVG has `aria-hidden="true"`; stroke uses `var(--tw)`.
- Cards for Korea and Japan are unchanged.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Changing any `rom` value. If a card fails the syllable check because its pinyin looks wrong, list it in your hand-off note instead of editing it.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
