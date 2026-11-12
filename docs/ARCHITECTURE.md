# Architecture

Read this before working on any spec in `docs/specs/`. It is meant to be the only background you need besides the files your spec names.

## What this is

A static, single-page study app. No framework, no build step, no dependencies. `index.html` loads plain scripts in order; every script shares one global scope.

It runs in two places from the same source:

| | GitHub Pages (public) | Claude-hosted copy (the owner’s) |
|---|---|---|
| Files | the repo as-is | `dist/claude.html`, built by `node tools/bundle.js` |
| `window.claude` | undefined | defined |
| Progress | `localStorage` only | `localStorage`, plus sync to the viewer’s Claude account |
| Remote requests | allowed | blocked, except Google Fonts and a few script CDNs |

Code must work in both. Feature-detect `window.claude`; never assume it.

## Load order (set in `index.html`)

1. `js/data/course.js`: `C` (countries), `CATS` (category labels), `RECOG`, `isRecog(card)`, `isDish(card)`, `WEEK_OF`, `RAW = {}`, `WEEKS`, `ESS`
2. `js/data/tw.js`, `kr.js`, `jp.js`: fill `RAW.tw`, `RAW.kr`, `RAW.jp`
3. `js/data/hangul.js`: `INIT`, `MED`, `FIN`, `FIN_ALL` (all 28 final slots, index 0 empty), `compose()`, `splitHangul(block)` (the letters of one syllable, or `[block]`), `LETTERS`, `WORDS`
4. `js/data/photos.js`: `PHOTOS` (card id to image file and credit), `PHOTOS_MISSING`, `licenseURL()`
5. `js/data/signs.js`: `SIGN_STYLE`, the drawn style of each sign card, keyed by card id
6. `js/data/situations.js`: `SITUATION_BY_CAT`, `SITUATION`, `situationOf()`
7. `js/data/parts-tw.js`, `parts-kr.js`, `parts-jp.js`: `PARTS` (card id to `{ parts: [[chunk, gloss], ...], lit }`, the word and character breakdowns) and `PARTS_SKIPPED`; `parts-tw.js` creates both and the other two add to them
8. `js/cards.js`: builds `CARDS`
9. `js/core.js`: `state`, saving, `cleanCard`, `cleanList`, `syncTrip` (trip cards, see below), `$`, `h`, `curWeek`, `shuffle`, `toast`, `bul`, `hearBtn`, `signClass`, `dishPhoto`, `speak`
10. `js/tones.js`: `toneMarks(rom)` (written tones), `spokenTones(rom)` (tones as spoken), `toneSVG(tones)`, `toneLine(card)` (tone contours for Taiwan cards; `tools/validate.js` also loads it)
11. `js/ai.js`: `askJSON(prompt, tier)`, the only way the app asks a model for anything (see “Asking Claude”); `aiReady`, `AI`, `MODELS`, `getKey`, `setKey`, `aiMessage(code)`
12. `js/tripcheck.js`: the trip-deck checks, with no page access: `PROBES`, `runTripChecks()`, `checkCards()`, `addPlaceByHand()`, `quickAdd()`, `applyTripReport()`, `applyTripCard()`, `removeTripCard()`, `resolveHold()`
13. `js/timeline.js`: the trip timeline with no page access: `tl`, `tlSorted`, `tlFilter`, `tlSplit`, `tlNextUp`, `todayISO`, `tlSave`, `tlAssetsInit`, `tlAttach`, `tlDropFile`, `tlDelete` (see “Trip timeline”)
14. `js/views/*.js`: one `render…()` function per screen (`credits.js` is the photo credits page, linked from the footer rather than the tabs; `trip.js` is “Your trip”; `timeline.js` is not a screen but the timeline panel, `timelineHTML()`, which `renderTrip()` includes)
15. `js/main.js`: `VIEWS`, `RENDER`, `render()`, all event listeners; starts the app

A new script must be added to `index.html` in the right position. `tools/bundle.js` and `tools/validate.js` read the script list from `index.html`, so nothing else needs updating.

## Images

`images/dishes/<card-id>.jpg` holds the dish photos: JPEG, at most 640 px wide and 60 kB, from Wikimedia Commons under public domain, CC0, CC BY or CC BY-SA. Every dish card id is in `PHOTOS` or `PHOTOS_MISSING`, and `tools/validate.js` enforces this. `tools/bundle.js` inlines the files as data URIs. Images are local files only; never hotlink.

## Cards

A data row in `js/data/<country>.js`:

```js
["order", "To go", "外帶", "wàidài", "why-dye", "Every counter asks: nèiyòng or wàidài?"]
// category, English, native script, romanization, sounds-like, note (optional)
```

`js/cards.js` turns each row into:

```js
{ id, c, wk, cat, en, nat, rom, say, note, ord }
```

- `c`: `"tw"`, `"kr"` or `"jp"`.
- `id`: `c + "-" + cat + "-" + slug(en)`. **Saved progress is keyed by id.** Changing a card’s category or English text orphans its progress, so don’t, unless the spec says to.
- `wk`: the week the card unlocks, from `WEEK_OF[c][cat]`.
- `cat`: `basics`, `order`, `num`, `dish`, `menu`, `around`, `sign`, `help`, plus `trip` for trip cards (below). Cards in `dish`, `menu` and `sign` are recognition cards (native text on the front); the rest are production cards (English on the front). Ask `isRecog(card)` and `isDish(card)` rather than testing `cat`, so trip dishes are covered.
- Romanization: Hanyu Pinyin with tone marks (tw), Revised Romanization (kr), Hepburn with macrons (jp).
- `say`: lowercase, syllables joined by hyphens, e.g. `kahm-sa-hahm-nee-da`.

To attach new information to cards (a photo, a breakdown, a label), add a **new data file keyed by card id** rather than adding columns to the rows. Keep it out of `state`.

## Trip cards

Cards the learner builds from their own itinerary on the “Your trip” screen. They live in `state.trip`, not in the data files, and `syncTrip()` copies them into `CARDS` at load and after every change:

```js
{ id: "trip-xxxxxxxx", c, wk: 0, cat: "trip", kind: "place" | "dish" | "phrase", en, nat, rom, say, note, ord }
```

- `wk: 0` makes them available from the first day. A `kind: "dish"` card is shown like a course dish.
- They have no entry in `PHOTOS`, `SIGN_STYLE` or `SITUATION`, and their pinyin is model-written, so `toneLine()` may return nothing. Anything keyed by card id must tolerate a missing entry.
- Their text comes from a model working from pasted notes. `cleanCard()` checks and caps every field; always go through it (or `cleanList()`) when a card enters `state`.
- A card joins the deck only through `runTripChecks(text, ask, existingCards, holdCards, onStep)` in `js/tripcheck.js`. It runs, in order: six known-answer translations (more than one miss discards the batch), local checks (script, pronunciation, duplicates), a blind reading by a second model on a different tier, and a comparison of the two readings. It returns a report `{probes, hits, blocked, added, held, out: [{card, why}], dupes, checked, error}` and changes nothing; `applyTripReport()` saves `added` to `state.trip` and `held` (business names the generator was unsure of) to `state.hold`. A rejected request sets `error` and leaves `added` and `held` empty. The only other ways in are `addPlaceByHand()` and `quickAdd()`, below.
- The pasted notes go to the model as data between `<trip>` tags, with any such tags stripped from the notes first. Keep it that way: never splice the notes into the instructions.
- `removeTripCard(id)` also deletes the card’s progress. `resolveHold(id, add)` moves a held name into the deck or discards it.
- `checkCards(cards, ask, onStep)` is the blind reading plus the comparison, shared by every way a card can join the deck. It takes cards that already passed the local checks and returns `[{ok, why}]`, one per card; it throws if a request is rejected. `runTripChecks()` and `addPlaceByHand()` both call it, so a change to those checks applies everywhere.
- `addPlaceByHand({c, en, nat}, ask, existingCards, holdCards, onStep)` adds one card from a name the learner pasted in the local script. It refuses before any model call if the script is wrong for the country, the name is empty or over 80 characters, the trip deck holds 150 cards, or the card is a duplicate. The model writes only `rom`, `say` and `note`; if the `nat` it returns differs in any character from what was typed, the result is rejected. The typed text goes to the model as JSON between `<entry>` tags, with any such tags stripped. It resolves `{card, why, error}` (`card` is null unless every check passed; `why` is a sentence to show; `error` is a code for `aiMessage()`) and changes nothing; `applyTripCard()` saves the card to `state.trip`. A passing card is not a guessed name, so it skips the hold list.
- `quickAdd({c, text}, ask, existingCards, holdCards, onStep)` adds one card from a word or phrase, detecting the input by script. Text containing local-script characters takes the `addPlaceByHand()` path (same refusals, same unchanged-`nat` rule) except that the model also supplies `en` and `kind`, and the comparison in `checkCards()` must agree with that `en`. English-only text (90 characters at most) is translated by the model, then goes through the script, pronunciation and duplicate checks and `checkCards()`; if the model marks a business name as uncertain, the card is refused and the learner is pointed to the by-hand form, since quick add has no hold list. Same `{card, why, error}` result; a duplicate of a course, trip or held card is reported, never added.
- The “Your trip” view runs both forms through `addOne()` in `js/views/trip.js`: it passes `askJSON` (or a function that rejects with `unavailable` / `no_key`, so refusals that need no model still show their own message first), shows `why` or `aiMessage(error)`, and calls `applyTripCard()`. One `trip.busy` flag disables every button and field while any request runs. The phrasebook’s “Nothing matches” message links to the quick-add box.
- `node tools/test-trip.js` runs the batch checks and `node tools/test-add.js` runs the one-card paths, each against a scripted model. Extend them when the checks change.

## Trip timeline

Flights, trains, hotels and bookings the learner enters on “Your trip”, in `state.timeline`. They are not cards and never become cards.

```js
{ id: "tl-xxxxxxxx", date: "YYYY-MM-DD", time: "HH:MM" | "", endDate: "" | "YYYY-MM-DD", kind: "flight"|"train"|"bus"|"hotel"|"activity"|"other",
  title, where, status: "booked" | "to-book", link: "" | "http(s) URL", file: "" | assetId, note }
```

- `cleanEntry()` and `cleanTimeline()` (in `js/core.js`, called by `normalize()`) drop entries with no real date or no title, cap strings, and drop any link that is not `http:` or `https:` or is over 500 characters. At most 200 entries.
- Ordering, the “To book” filter, “Earlier” and “Next up” are pure functions in `js/timeline.js` that take `today` as a `YYYY-MM-DD` string (`todayISO()` supplies it). An entry is Earlier once its `endDate` (or its `date`, if it has none) is before today, so a hotel stay stays in view until it ends. “Next up” is the first entry of the visible list whose `date` is today or later. `tlSave(fields, id)` validates the form (refusing bad links with a message) and saves.
- Attachments exist only in the Claude-hosted copy. `tlAssetsInit()` sets `tl.assets` to the `claude.use("assets")` namespace, or null (GitHub Pages, no permission), in which case the attach control is hidden. Only the asset id is stored on the entry; the file is served at `"/_blob/" + id`. PDF, PNG and JPEG, at most 20 MiB. `tlAttach` uploads first, stores the id, then deletes the old asset when replacing. `tlDropFile` and `tlDelete` delete the asset first and keep the entry if that fails. Assets are deleted only by these functions, called from a learner’s confirmed click; never on load, normalize or sync.
- The Claude-hosted copy must be published with the `assets` capability declared next to `db`, `user` and `sample`.
- `node tools/test-timeline.js` runs the real code with only `claude.use("assets")` stubbed.

## Asking Claude

`askJSON(prompt, tier)` in `js/ai.js` is the shared entry point; every feature (the batch build, adding a place by hand) passes it to the pure functions in `js/tripcheck.js` as `ask` rather than calling a model itself. `tier` is `"default"` or `"complex"`. It resolves with parsed JSON and rejects with `{code}`; `aiMessage(code)` gives the sentence to show.

| | Claude-hosted copy | GitHub Pages |
|---|---|---|
| How | `window.claude.use("sample")`, then `sample.json(prompt, {modelTier, cache: false})` | `POST https://api.anthropic.com/v1/messages` with the visitor’s own API key and the `anthropic-dangerous-direct-browser-access: true` header |
| Needs | the copy published with the `sample` capability declared; the viewer consents on first use | a key the visitor pastes in, kept in `localStorage` under `trip-phrasebook-key` (never in `state`, so it is not synced) |
| Models | chosen by the platform from the tier | `MODELS` in `js/ai.js`; check the ids against Anthropic’s documentation when changing them |

`AI.mode` is `"claude"`, `"key"` or `"none"` once `aiReady` resolves. A failed or declined request must add nothing and say so. Model output is untrusted: validate it and escape it with `h()`.

## Saved progress

`state` in `js/core.js`, stored under the `localStorage` key `trip-phrasebook-v1`:

```js
{ start, cards: { [id]: { b, due } }, day, newDone, streak, lastDay, auto, updated, trip, hold, itin, timeline }
```

- `trip`: accepted trip cards. `hold`: business names waiting for the learner to confirm. Both are lists of `{ id, c, kind, en, nat, rom, say, note }`, at most 150 each. `itin`: the text last used to build cards, at most 4,000 characters. `timeline`: see “Trip timeline.”
- `start`, `due`, `day`, `lastDay` are local day numbers from `today()`.
- `b` is the review box, 1 to 5; gaps are `GAP = [0,1,2,4,8,16]` days.
- Call `commit()` after changing `state` in response to a user action. It stamps `updated`, saves locally, and syncs when running in Claude.
- New fields must get a default in `blank()` and be read in `normalize()`, which must tolerate old saved data that lacks them.

## Views and events

- Each screen is a `<section class="view" id="v-NAME">` filled by its render function with an HTML string.
- To add a screen: add the section and nav link in `index.html`, the name in `VIEWS` and `RENDER` (`js/main.js`), a `js/views/NAME.js`, and the name in `VIEWS` inside `tools/validate.js`.
- Routing is by plain hash: `#plan`, `#study`. Use only letters, digits and hyphens.
- Clicks are handled by one delegated listener in `js/main.js` that switches on `data-*` attributes of the clicked button. Add a branch there; don’t attach listeners inside render functions.
- Escape everything that isn’t a literal with `h()` before putting it in HTML.

## Style rules

- Colors come from the CSS variables at the top of `css/styles.css` (`--paper`, `--surface`, `--ink`, `--muted`, `--rule`, `--tw`, `--kr`, `--jp`, `--good`, `--warn`). They are defined three times: light, dark by system preference, and dark by `data-theme`. Add any new color to all three.
- An element with `data-c="tw|kr|jp"` gets that country’s color as `--c`.
- Native text needs a `lang` attribute (`C[c].hl`) so the right font and glyph variants are used.
- Must work at 380 px wide. Wide content scrolls inside its own container; the page never scrolls sideways.
- Text people read uses typographic quotes and apostrophes (’ “ ”). Code keeps straight quotes.
- Sentence case for headings and buttons. Plain, direct wording.
- No remote images, no `fetch` to other sites, no new libraries, unless the spec says so. The one `fetch` is in `askJSON`.

## Checking your work

1. `node tools/validate.js` must print `OK`, and `node tools/test-trip.js`, `test-add.js` and `test-timeline.js` must pass.
2. `node tools/bundle.js` must succeed.
3. Open `index.html` in a browser and click through every tab, in light and dark mode, at phone width.
4. If your spec added a data file, extend `tools/validate.js` to check it, as the spec describes.

## What not to change without a spec saying so

Card ids, the `localStorage` key, the shape of `state`, the week structure, and the content of existing cards.
