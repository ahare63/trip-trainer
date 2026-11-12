# Trip decks with a checking step

- **Suggested model:** Fable 5.2, in a fresh context
- **Depends on:** None (an unpublished draft exists; see below)
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

The learner pastes an itinerary or a list of places. Claude writes cards specific to that trip (places, regional dishes, situational phrases), and every card must pass checks before it joins the deck.

## What to build

**Starting point.** `docs/drafts/trip-decks.single-file.diff` is a complete draft of this feature, written against the earlier single-file version of the app. Port it into the split layout; don’t start over. It has only ever been run against a mocked model, never a real one.

**Screen.** A “Your trip” view: text box (saved in `state.itin`), a build button with progress text, a report of what happened, a “Confirm these names” list, the list of trip cards with remove buttons, and a short explanation of the checks.

**Model access, both runtimes.**
- In Claude: `window.claude.use("sample")`, then `sample.json(prompt, { modelTier, cache: false })`. The Claude-hosted copy must be republished with the `sample` capability declared.
- On GitHub Pages: the visitor’s own Anthropic API key, kept in `localStorage`, sent only to `api.anthropic.com` with the `anthropic-dangerous-direct-browser-access: true` header. Verify current model names against Anthropic’s documentation before shipping.
- One `askJSON(prompt, tier)` function hides the difference. Later specs reuse it.

**Checks, in order.**
1. Known answers: each run asks the generator to translate six phrases with known answers, two per language, drawn at random from a fixed list. More than one miss discards the whole batch.
2. Local: right script for the country, pronunciation fields present, not already in the deck.
3. Blind reading: a second model, on a different tier, sees only the native text and reports what it means, whether it is well-formed, and how it is romanized.
4. Comparison: a card passes only if meaning, romanization and sounds-like spelling all agree.
5. Business names the generator marked as uncertain go to “Confirm these names” and join the deck only when the learner approves them.

**State.** Add `trip` (accepted cards), `hold` (awaiting confirmation) and `itin` to `state`, with defaults and sanitizing in `normalize()`. Trip cards join `CARDS` with `cat: "trip"`, `wk: 0`, ids of the form `trip-xxxxxxxx`.

## Done when

- With a mocked model: a clean run adds cards; a failed known-answer test adds nothing; a card in the wrong script, a card the second model rejects, and a duplicate are each left out with the right reason; an uncertain business name lands in the hold list.
- With a real model, in the Claude-hosted copy, using a short real itinerary: report the known-answer score, how many cards passed, and read every accepted card yourself for errors. Put the results in your hand-off note.
- Trip notes are passed to the model as data inside delimiters and the prompt says so; text in the notes cannot change the instructions.
- Any failed or declined request adds nothing and says so plainly.
- Trip cards appear in Today’s cards and in the phrasebook under “Your trip,” and removing one also removes its progress.
- The screen states that the checks cannot confirm what a business calls itself.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Photos for trip cards. Reading screenshots or PDFs (07c). Adding places by hand (07a).

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
