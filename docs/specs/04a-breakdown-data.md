# Character and word breakdowns: data

- **Suggested model:** Opus 5.5 to write, then a second model in a fresh context to review
- **Depends on:** None
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

For each card, split the native text into meaningful pieces with a short English gloss for each, so a learner can see why the phrase means what it does. Example: 牛肉麵 is 牛肉 “beef” + 麵 “noodles.”

## What to build

- Three data files: `js/data/parts-tw.js`, `parts-kr.js`, `parts-jp.js`, each adding to one object: `PARTS[cardId] = { parts: [[chunk, gloss], ...], lit: "optional literal meaning" }`.
- Chunks are the smallest units useful to a beginner: usually a word, sometimes a single character (Mandarin) or a grammatical ending (Korean, Japanese). Particles and endings get a plain-language gloss such as “topic marker” or “polite ending.”
- `lit` is for phrases whose literal meaning is memorable and differs from the translation (不好意思: “not at ease”).
- Skip cards where a breakdown adds nothing (single-unit words such as 茶). List skipped ids in `PARTS_SKIPPED` so the gap is deliberate.
- Review pass: a second model, given only the chunks and glosses with no access to the first model’s reasoning, marks each entry agree or disagree. Fix or remove every entry it disagrees with. Record the review outcome in your hand-off note.

## Done when

- For every entry, the chunks joined together equal the card’s `nat` exactly, punctuation and spaces included (a punctuation chunk may have an empty gloss). `tools/validate.js` enforces this.
- Every card id is in exactly one of `PARTS` or `PARTS_SKIPPED`.
- Glosses are at most 24 characters, lowercase, with typographic quotes.
- State plainly in the hand-off note that this data is model-written and not checked by native speakers.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Any display work (that is spec 04b). Changing existing card text.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
