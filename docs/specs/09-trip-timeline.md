# Trip timeline

- **Suggested model:** Sonnet 5.5
- **Depends on:** 06
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

One place for the trip’s logistics, in order: flights, trains, hotels and bookings, each linking straight to its ticket or confirmation, so the learner never has to dig through email. Things still to book sit in the same list.

## What to build

**Entries.** A “Timeline” section on the “Your trip” view. Each entry has:
- `date` (required, `YYYY-MM-DD`), optional `time` (`HH:MM`) and optional `endDate` (for a hotel stay). Times are local to where the entry happens; nothing converts time zones.
- `kind`: `flight`, `train`, `bus`, `hotel`, `activity` or `other`.
- `title` (“TPE → ICN, EVA BR170”, “Grand Hyatt Taipei”), optional `where` (city or station).
- `status`: `booked` or `to-book`.
- Optional `link`: the ticket or booking page. Only `https:` and `http:` URLs are accepted; anything else is refused when entered and dropped when loaded.
- Optional `file`: an attached ticket (PDF, PNG or JPEG), Claude-hosted copy only (see below).
- Optional `note`.

**List.** Sorted by date, then time, with entries that have no time first on their day. Entries before today are collapsed under “Earlier.” The first entry today or later is marked “Next up.” A “To book” filter shows only `to-book` entries. Each entry has edit and delete. Links open in a new tab.

**Attachments (Claude-hosted copy only).** Declare `capabilities: {assets: {}}` alongside the existing `db`, `user` and `sample`. Upload with `claude.use("assets")`, store the returned asset `id` on the entry, and open it from the asset’s URL. Deleting an entry, or replacing its file, deletes the old asset. When `use("assets")` resolves `null` (GitHub Pages, or no permission), hide the attach control and say links still work. Files are visible to anyone the artifact is shared with; say so next to the control.

**State.** Add `timeline` (array of entries, each with an id of the form `tl-xxxxxxxx`) to `state`, with a default in `blank()` and sanitizing in `normalize()` that tolerates old saved data: drop entries with no valid date, cap string lengths, drop bad links. On GitHub Pages the timeline lives in this browser only, like the rest of progress.

## Done when

- A node test (`tools/test-timeline.js`, run in CI) covers:
  - sorting, including same-day entries with and without a time;
  - which entry is “Next up” for a given today;
  - the “To book” filter;
  - sanitizing: a `javascript:` link and an entry with no date are both dropped;
  - old saved data with no `timeline` loads.
- Every entry field is escaped with `h()`, and links get `rel="noopener"`.
- Uploading, opening, replacing and deleting an attachment work in the Claude-hosted copy. Delete never runs except on the learner’s action.
- Works at 380 px wide.
- `node tools/validate.js` prints OK, the existing tests pass, and `node tools/bundle.js` succeeds.

## Out of scope

Time-zone conversion, reminders and notifications, reading confirmation emails or screenshots (spec 07c), and making cards from entries.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
