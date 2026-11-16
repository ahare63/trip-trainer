# Timeline from a screenshot

- **Suggested model:** Opus 5.5
- **Depends on:** 07c and 09
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

The learner drops in a screenshot of a booking confirmation (a flight, train, hotel or restaurant) and gets the timeline entry filled in for them to check and save, instead of typing it.

## What to build

- A “Fill from a screenshot” button on the Timeline panel, next to “Add an entry.” PNG and JPEG only, up to 5 MB, checked the same way as spec 07c (`shotImage()`).
- One request to the model that extracts timeline entries: `date`, `time`, `endDate`, `kind`, `title`, `where`, the booking’s confirmation number (`ref`), and for a flight or train its arrival (`arriveAt`, `arriveTime`, `arriveDate`).
  - A flight or train is one entry at its departure, titled like “TPE → ICN, EVA BR170”. A hotel stay is one entry from check-in (`date`) to check-out (`endDate`). A restaurant booking is an `activity`.
  - Times are copied as printed, local to where they happen. If the year is not printed, the model uses the first such date on or after today, which the prompt gives it.
  - Places in any country count: a flight from San Francisco is still part of the trip.
- The reply is checked in code. Entries with no real date or no title are dropped; a bad time or an end date before the date is cleared; a title or place that looks like an email, link, price, masked card or phone number drops the entry. Flight and train numbers are kept. At most 6 entries.
- Each entry found opens the existing entry form, filled in, one after another (“1 of 2”), with Skip and Cancel. Nothing is saved until the learner presses “Add to timeline”, and status is always `booked`.
- The note holds `Confirmation: <ref>` and, for a flight or train, `Arrives <place> <time>` (with the date if it differs). The form says that the note is visible to anyone the page is shared with.
- In the Claude-hosted copy, a box (off by default) attaches the screenshot to the entry through the spec 09 attachment path. Without it, the image is used for the one request and not stored.

## Done when

- `tools/test-tlshot.js` (run in CI) covers: a hotel and a flight read into the right fields and notes; the prompt’s ignore list and its instructions-are-data line; files refused before any request; leaked emails, prices, cards and phones dropped; card-shaped confirmation numbers dropped; nothing found; bad replies; the cap; saving with and without the attachment box; saving when files can’t be attached.
- Nothing is saved by reading, and the image is never kept unless the box is ticked.
- Works at 380 px wide.
- `node tools/validate.js` prints OK, the existing tests pass, and `node tools/bundle.js` succeeds.

## Out of scope

Making cards from the same screenshot (spec 07c does that separately). PDFs. Links: the model does not read URLs out of images.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
