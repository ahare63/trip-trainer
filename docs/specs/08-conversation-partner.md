# Typed conversation partner

- **Suggested model:** Opus 5.5
- **Depends on:** 06
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Short role-plays of travel situations, limited to what the learner has studied, with feedback afterward.

## What to build

- Scenarios per language, each a few lines of setup: ordering at a food stall, bubble tea counter, restaurant door and bill, taxi, buying a train ticket, hotel check-in, asking the way.
- The partner’s lines are restricted to the learner’s seen cards (ids in `state.cards`) plus at most two new words per scene, which are flagged as new. Send the allowed vocabulary in the prompt.
- Each partner line shows local script, sounds-like spelling, audio, and English on tap.
- The learner is a beginner without a keyboard for these scripts: they reply by tapping phrase chips built from their known cards, or by typing romanization or English. An English “how do I say…” gets a coached answer rather than counting as a turn.
- Six to eight turns, then feedback: what worked, what to say instead, and any new words offered as cards through the spec 07b path.
- Uses `askJSON` from spec 06 with the conversation kept by the page and sent each turn.

## Done when

- The partner never uses vocabulary outside the allowed list without flagging it; check this in code against the list, not by trusting the model.
- A scene can be stopped at any point; nothing is saved except cards the learner chooses to add.
- Declined or failed requests end the scene with a plain message.
- Tested in all three languages with a learner state from week 2 and from week 7; transcripts in the hand-off note.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Speech input and pronunciation scoring. Open-ended chat outside the scenarios.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
