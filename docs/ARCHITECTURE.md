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

1. `js/data/course.js`: `C` (countries), `CATS` (category labels), `RECOG`, `WEEK_OF`, `RAW = {}`, `WEEKS`, `ESS`
2. `js/data/tw.js`, `kr.js`, `jp.js`: fill `RAW.tw`, `RAW.kr`, `RAW.jp`
3. `js/data/hangul.js`: `INIT`, `MED`, `FIN`, `compose()`, `LETTERS`, `WORDS`
4. `js/data/photos.js`: `PHOTOS` (card id to image file and credit), `PHOTOS_MISSING`, `licenseURL()`
5. `js/data/signs.js`: `SIGN_STYLE`, the drawn style of each sign card, keyed by card id
6. `js/data/situations.js`: `SITUATION_BY_CAT`, `SITUATION`, `situationOf()`
7. `js/cards.js`: builds `CARDS`
8. `js/core.js`: `state`, saving, `$`, `h`, `curWeek`, `shuffle`, `toast`, `bul`, `hearBtn`, `signClass`, `dishPhoto`, `speak`
9. `js/tones.js`: `toneMarks(rom)` (written tones), `spokenTones(rom)` (tones as spoken), `toneSVG(tones)`, `toneLine(card)` (tone contours for Taiwan cards; `tools/validate.js` also loads it)
10. `js/views/*.js`: one `render…()` function per screen (`credits.js` is the photo credits page, linked from the footer rather than the tabs)
11. `js/main.js`: `VIEWS`, `RENDER`, `render()`, all event listeners; starts the app

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
- `cat`: `basics`, `order`, `num`, `dish`, `menu`, `around`, `sign`, `help`. Cards in `dish`, `menu` and `sign` are recognition cards (native text on the front); the rest are production cards (English on the front).
- Romanization: Hanyu Pinyin with tone marks (tw), Revised Romanization (kr), Hepburn with macrons (jp).
- `say`: lowercase, syllables joined by hyphens, e.g. `kahm-sa-hahm-nee-da`.

To attach new information to cards (a photo, a breakdown, a label), add a **new data file keyed by card id** rather than adding columns to the rows. Keep it out of `state`.

## Saved progress

`state` in `js/core.js`, stored under the `localStorage` key `trip-phrasebook-v1`:

```js
{ start, cards: { [id]: { b, due } }, day, newDone, streak, lastDay, auto, updated }
```

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
- No remote images, no `fetch` to other sites, no new libraries, unless the spec says so.

## Checking your work

1. `node tools/validate.js` must print `OK`.
2. `node tools/bundle.js` must succeed.
3. Open `index.html` in a browser and click through every tab, in light and dark mode, at phone width.
4. If your spec added a data file, extend `tools/validate.js` to check it, as the spec describes.

## What not to change without a spec saying so

Card ids, the `localStorage` key, the shape of `state`, the week structure, and the content of existing cards.
