# Signs drawn as signs

- **Suggested model:** Haiku 5.5
- **Depends on:** None
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Sign cards (`cat: "sign"`) currently show bare characters. Show them the way a traveler meets them: on a board, plate or notice. This is CSS styling of text, not illustration.

## What to build

- New data file `js/data/signs.js`: `const SIGN_STYLE = { [cardId]: "board" | "door" | "notice" | "plaque" | "compass" }`.
  - `board`: wayfinding, e.g. exit, entrance, station, ticket gate, restroom, pharmacy.
  - `door`: push and pull.
  - `notice`: prohibited, no smoking, free of charge, open, closed.
  - `plaque`: men, women.
  - `compass`: east, west, south, north and the Japanese direction exits.
- CSS for each style in `css/styles.css`, using existing color variables only.
- Apply on the front of sign cards in `js/views/study.js` and on sign rows in `js/views/phrasebook.js`.
- Add `js/data/signs.js` to `index.html` after `hangul.js`.

## Done when

- Every card with `cat: "sign"` has an entry; `tools/validate.js` fails if one is missing or a key is not a real card id.
- Text contrast is at least 4.5:1 in light and dark themes.
- Nothing overflows at 380 px wide, including the longest sign text.
- No images, no SVG files, no new colors outside the existing variables.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Copying any real operator’s signage design, logo or pictogram. These are generic, stylized signs.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
