# Dish photos from Wikimedia Commons

- **Suggested model:** Sonnet 5.5 with web access
- **Depends on:** None
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

Give each dish card a photo on its answer side, using freely licensed images, with proper credit.

## What to build

- Images in `images/dishes/<card-id>.jpg`: JPEG, at most 640 px wide, at most 60 kB each.
- Data file `js/data/photos.js`: `PHOTOS[cardId] = { file, title, author, license, source }` where `source` is the file’s page on commons.wikimedia.org. `PHOTOS_MISSING` lists dish card ids with no suitable photo.
- Accept only: public domain, CC0, CC BY, CC BY-SA (any version). Reject anything marked non-commercial or no-derivatives, and anything whose license is unclear. Record author and license exactly as the file page states them.
- Confirm from the file’s description and categories that the photo shows the named dish, not a similar one.
- A “Photo credits” section listing every photo with author, license and link, reachable from the footer.
- Show the photo on the answer side of dish cards in `js/views/study.js` and in dish rows in `js/views/phrasebook.js`. Give each image an `alt` naming the dish.
- Extend `tools/bundle.js` to inline images as data URIs so the single-file copy works without remote requests.

## Done when

- `tools/validate.js` checks: every `PHOTOS` file exists and is within the size limit; license is in the allowed list; author and source are present; every dish card id is in `PHOTOS` or `PHOTOS_MISSING`.
- `dist/claude.html` stays under 8 MB.
- The photo never appears on the front of a card.
- Add a line to `README.md` noting that photos carry their own licenses, listed in the credits.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

Photos for anything but the built-in dish cards. Generated images. Hotlinking: every image must be a file in the repo.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
