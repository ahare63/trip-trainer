# Add a place by hand

- **Suggested model:** Sonnet 5.5
- **Depends on:** 06
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

The learner pastes a place’s name in the local script, copied from a booking or a map, and gets a card. Because the name comes from the source, nothing is guessed.

## What to build

- A small form on the “Your trip” view: country, what it is in English (“My hotel in Seoul”), and the local-script name.
- The model writes only `rom`, `say` and an optional one-line `note`. It must return `nat` unchanged.
- Run the blind-reading and comparison checks from spec 06 on the pronunciation. On a pass, add the card straight to the deck.

## Done when

- If the returned `nat` differs from what was typed in any character, reject the result.
- Input in the wrong script for the chosen country is refused before any model call, with a plain message.
- Works in both runtimes through `askJSON`.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Looking places up online. Guessing a local name from an English one (that is spec 06’s job, with its hold list).

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
