# Card icons and a “More info” section

- **Suggested model:** Opus 5.5
- **Depends on:** 04b, 05
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Give every study card a picture to help memorization, and keep cards uncluttered by moving the details a learner rarely needs into a collapsed “More info” section.

## What to build

- One icon per card without a dish photo, from OpenMoji’s outline set (CC BY-SA 4.0), drawn in the country colour. Files in `images/icons/<hexcode>.svg`; data in `js/data/icons.js`, keyed by card id. A meaning with no single icon uses a combination: a no sign over an item, or a corner badge. Trip cards get a generic icon by kind (place, dish, phrase).
- The icon appears on the front of production cards, above the English, and on the answer side only for recognition cards (signs, menu words, dishes), where the meaning is the question.
- On the answer side, a “More info” section holds the breakdown, the literal translation, the standard romanization and the note. Dish notes stay visible, since they describe the food. Taiwan tone lines stay visible.
- “More info” stays open across cards and sessions once the learner opens it (`state.more`).
- Credits for the icons on the Credits page (the footer link, renamed from “Photo credits”).
- Remove the Taiwan “No cilantro” card: “Not spicy, please” teaches the same 不要 pattern.

## Done when

- `tools/validate.js` checks every card has an icon or a photo, every code has a file under 8 kB, and every file is used.
- `node tools/test-cards.js` passes and runs in CI.
- Icons render on GitHub Pages and in `dist/claude.html`, in light and dark mode.
- The phrasebook and Essentials lists are unchanged.

## Out of scope

Icons in the phrasebook or Essentials lists. Characters on the front of production cards (it would turn recall into reading aloud). A reading-direction deck.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
