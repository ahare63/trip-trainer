# Quick add

- **Suggested model:** Sonnet 5.5
- **Depends on:** 06
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

A one-line box for a word or phrase the learner ran into: typed in English or pasted in local script. It becomes a checked card.

## What to build

- Input: country, plus text in either English or the local script (detect which by script).
- English in: the model translates, then the full checks from spec 06 apply.
- Local script in: as spec 07a, and the model also supplies the English meaning, which the blind reading must agree with.
- Place it on the “Your trip” view and link to it from the phrasebook’s empty-search message.

## Done when

- One card per submission; duplicates of existing cards are reported, not added.
- A failed check adds nothing and shows the reason.
- Works in both runtimes through `askJSON`.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Camera or image input. Live translation of longer text.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
