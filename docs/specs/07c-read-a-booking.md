# Read a booking screenshot

- **Suggested model:** Opus 5.5
- **Depends on:** 06 and 07a
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

The learner drops in a screenshot of a booking confirmation. The app pulls out the place names and offers them as cards.

## What to build

- Accept PNG and JPEG. Send the image to the model with a prompt that extracts only places: English name, local-script name exactly as printed (or empty if not printed), type, and country.
- Show the extracted places as a checklist. Ticked places with a printed local name go through the spec 07a path; ticked places without one go through spec 06’s generator and hold list.
- In Claude: the copy must be published with `sample: { images: true }`. On GitHub Pages: send an image block to the Messages API through the key path.
- The image is used for the one request and not stored.

## Done when

- The prompt tells the model to ignore names of people, confirmation numbers, prices, payment details and contact details, and none of these appear in the checklist in testing.
- A local name is only ever taken as printed; the model is told never to fill one in.
- An image with no places in Taiwan, Korea or Japan yields a clear “nothing found.”
- Tested with at least one real hotel confirmation and one restaurant booking; results in the hand-off note.
- `node tools/validate.js` prints OK and `node tools/bundle.js` succeeds.

## Out of scope

PDF upload (a later step, once images work). Email or calendar access.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
