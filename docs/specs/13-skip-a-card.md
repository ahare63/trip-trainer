# Skip a card

- **Suggested model:** Opus 5.5
- **Depends on:** 08, 12
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Let the learner drop a course card that doesn’t apply to them (“I’m vegetarian” for someone who eats meat) without deleting it from the course for everyone else, and get it back if they change their mind.

## What to build

- `state.skip`: a list of skipped course card ids. Default `[]`. `normalize()` keeps only strings that are ids of course cards (not trip cards), without duplicates. Progress in `state.cards` is kept when a card is skipped, so bringing it back resumes where it was.
- A “Skip this card” button on study cards, front and answer side, for course cards only. Trip cards already have Remove on the Your trip tab. Skipping takes every copy of the card out of the current session without grading it, so a skipped new card doesn’t count toward the 12 new cards a day.
- After a skip, a toast says the card is skipped and offers Undo. Undo brings the card back and puts it back at the current spot in the session.
- Skipped cards leave the study queue, “Practice 12 at random”, the Plan tab’s progress and due counts and the week’s new-card counts, and the Talk tab’s allowed vocabulary and readiness count. One helper, `studyCards()`, returns `CARDS` without skipped cards, and those callers use it.
- The phrasebook still lists skipped cards, marked “Skipped,” with a “Bring back to study” button. Essentials and its quiz are unchanged: they are a fixed short list.
- New Taiwan order card “Regular ice” 正常冰 (zhèngcháng bīng, “jung-chahng bing”), next to Less ice and No ice, with an icon, a breakdown and the bubble-tea situation label. Shops ask about ice whatever you want, and the deck had no answer for “normal.”

## Done when

- `node tools/test-skip.js` passes and runs in CI. It loads the real scripts and checks, through rendered views and saved state: skipping takes the card out of the session and later queues, Undo restores it, progress survives a skip, the phrasebook marks it and brings it back, Plan totals and Talk readiness leave it out, trip cards have no skip button, and old saved data without `skip` loads.
- `tools/validate.js` and all other tests pass; `node tools/bundle.js` succeeds.

## Out of scope

Skipping trip cards, Essentials cards in the Essentials list, a separate “Skipped cards” screen.
