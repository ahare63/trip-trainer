# Situation labels on phrase cards

- **Suggested model:** Haiku 5.5
- **Depends on:** None
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Tell the learner where a phrase is used: “At a bubble tea counter,” “In a taxi.” A short label at the top of each production card.

## What to build

- New data file `js/data/situations.js`:
  - `SITUATION_BY_CAT`: a default label per category for `basics`, `order`, `num`, `around`, `help`.
  - `SITUATION`: overrides keyed by card id where the default is too vague (bubble tea sugar and ice cards, taxi phrases, restaurant-door phrases, paying).
  - `situationOf(card)`: override, else category default, else `""`.
- Show the label on the card in `js/views/study.js` (visible before the answer) and as small muted text in `js/views/phrasebook.js`.

## Done when

- At most 10 distinct labels in total, each at most 32 characters, sentence case, no trailing period.
- Every card in the five categories above resolves to a non-empty label; `tools/validate.js` checks this and that override keys are real card ids.
- Recognition cards (`dish`, `menu`, `sign`) show no label.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Rewriting card notes. Icons or illustrations.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
