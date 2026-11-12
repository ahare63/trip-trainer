# Before you go: reading notes

- **Suggested model:** Sonnet 5.5 with web access
- **Depends on:** 06
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Short reading notes on history and culture for the places on the trip: something to read on the plane, not flashcards to drill.

## What to build

**Built-in notes.** A data file `js/data/notes.js` with `NOTES[key] = {title, c, body, source, sourceTitle}` for three cities: Taipei, Seoul and Tokyo.
- Each body is 150 to 250 words in plain paragraphs: how the city came to be, one or two things a visitor will notice because of that history, and one custom or habit worth knowing.
- Write each one from its English Wikipedia article. `source` is that article’s URL and `sourceTitle` its title. Read the article; don’t write from memory. Summarize in your own words; don’t copy sentences.
- Show the line “Based on the Wikipedia article ‘…’ (CC BY-SA)” with the link under each note.

**Notes for the learner’s own places.** On the “Your trip” view, a “Before you go” section lists the trip cards of kind `place`, plus the built-in cities.
- Each place has a “Write a note” button. It calls `askJSON` for a note of 100 to 200 words with the same structure, as JSON `{body}`. Store it in `state.notes[tripCardId] = {body, at}`.
- Generated notes are labelled “Written by Claude from its own knowledge, not checked against a source.” Each one has a “Read more on Wikipedia” link to a Wikipedia search for the place’s English name. The page never fetches Wikipedia itself.
- The prompt passes the place name and English description as data inside delimiters, like spec 06.
- Removing a trip card also removes its note. A note can be rewritten or deleted.

**State.** `notes` in `state`, with a default and sanitizing in `normalize()` that tolerates old data.

## Done when

- `tools/validate.js` checks every built-in note: body length within range, a `https://en.wikipedia.org/wiki/` source, typographic quotes, and `c` a real country.
- A failed or declined request saves nothing and says so plainly.
- Notes show only the stored text, escaped with `h()`, with paragraphs kept.
- Works at 380 px wide.
- `node tools/validate.js` prints OK, the existing tests pass, and `node tools/bundle.js` succeeds.

## Out of scope

Flashcards made from notes, notes for anything but places, fetching Wikipedia from the page, and images.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
