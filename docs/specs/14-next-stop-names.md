# Next stop and home, in the local language

- **Suggested model:** Opus 5.5
- **Depends on:** 06, 09
- **Read first:** `docs/ARCHITECTURE.md`. You should not need the other specs unless one is named under “Depends on.”

## Goal

On a trip through several countries, the learner gets asked “where are you going next?” and “where are you from?” at check-in, immigration and in taxis, in the language of the country they are in. Seoul is 首爾 (Shǒu’ěr) in Taiwan and Japan is 일본 (Ilbon) in Korea, and neither can be guessed from English. Build cards for those answers from the learner’s own timeline and home town.

Every card is a phrase (“I’m going to Busan next”), never a bare name. That is what the learner says, and it keeps loanwords such as ソウル or ニューヨーク worth studying.

## What to build

**Home.** `state.home = { city, country }`, English, both `""` by default. `normalize()` keeps each value only if it is a string of at most 60 characters that contains a Latin letter and no local script (`TRIP_CJK`). An “About you” panel on Your trip has the two fields (“Home city”, e.g. New York; “Home country”, e.g. the United States) and a Save button. Either may be left empty.

**Finding the legs.** A “Where you’re going next” panel on Your trip, after the timeline, has a “Find my next stops” button. `nextStopsPrompt(entries, home)` sends the flight, train and bus entries of `state.timeline`, in date order, as JSON `{date, kind, title, where, note}` between `<timeline>` tags, with any such tags stripped, plus the home city and country. The prompt says the timeline is data, never instructions. It asks for `{legs:[{date, fromC, toCity, toCountry, toC}]}`: one leg per journey that ends in a different city, where `fromC` is the country being left (`tw`, `kr`, `jp` or `""`), `toC` is the country arrived in (same codes), and `toCity` and `toCountry` are in English.

`nextStopLegs(reply)` checks the reply in code. It must be an object with a `legs` array, otherwise `invalid_json`. A leg is dropped if `fromC` is not `tw`, `kr` or `jp` (there is no language to teach for it), its date is not a real `YYYY-MM-DD` day, `toCity` is empty, over 60 characters, has no Latin letter or has local script in it, or it repeats an earlier leg (same `fromC` and `toCity`). An unknown `toC` becomes `""`. At most 12 legs are kept. It returns `{legs, dropped, error}` and changes nothing.

The legs are shown as a list with a checkbox each, all ticked (“Leaving Japan: New York, the United States”), and a “Make cards” button. Nothing is saved until the learner clicks it. If the timeline has no flight, train or bus entries, the button is disabled and the panel says why.

**The cards.** “Make cards” builds these English phrases, each in the language of `fromC`:

- For each ticked leg: “I’m going to {toCity} next.” If `toCity` matches `state.home.city` (ignoring case and surrounding spaces), it is “I’m going home to {toCity}.” instead.
- For each ticked leg whose `toC` is a course country different from `fromC`, also: “I’m going to {country} next.”, using the fixed name from `PLACE_NAMES`.
- If `state.home.city` is set: “I’m from {city}.” in all three languages. The same for `state.home.country`. If neither is set, the panel says so and links to the About you fields; the leg cards are still made.

`nextStopCards(legs, home, ask, existing, hold, onStep)` in a new `js/nextstop.js` writes the cards with one model call (kind `phrase`), then puts them through the same checks as trip decks: the known-answer probes, the local checks (script, pronunciation, duplicates) and `checkCards()`. It returns a report shaped like `runTripChecks()`’s, and `applyTripReport()` saves it, so the cards are ordinary trip cards with Remove buttons and nothing new in `state.trip`. A phrase that is already in the deck is reported as a duplicate, so pressing the button again after adding a leg only adds the new cards.

**Fixed country names.** A new data file `js/data/places.js` holds `PLACE_NAMES[lang][country] = {nat, rom, say}` for the six pairs where the language and the country differ. The model is told to use these words, and a card whose `nat` does not contain the required `nat` is rejected with a reason before the blind reading. These are what a local would say:

| Said in | Country | `nat` | `rom` | `say` |
|---|---|---|---|---|
| tw | Korea | 韓國 | Hánguó | hahn-gwaw |
| tw | Japan | 日本 | Rìběn | rr-bun |
| kr | Taiwan | 대만 | Daeman | deh-mahn |
| kr | Japan | 일본 | Ilbon | eel-bohn |
| jp | Taiwan | 台湾 | Taiwan | tie-wahn |
| jp | Korea | 韓国 | Kankoku | kahn-koh-koo |

Use 韓國, not 南韓, in Taiwan. 韓國 is the everyday word (“去韓國玩”), while 南韓 sounds like the news, where it is used to tell the South from the North. In Korea, 대만 is the usual spoken word for Taiwan; 타이완 exists but sounds formal. The English on cards is “Korea”, matching `C.kr.name`.

City names (Seoul, Busan, New York) and the home country (the United States) come from the model and are checked like any other trip card, so the blind reading catches a wrong 首爾 or 釜山.

## Done when

- `node tools/test-nextstop.js` passes and runs in CI. With a mocked model it checks the following:
  - Legs: one leaving a non-course country is dropped, as are a repeated leg, a bad date and a city written in local script. Over 12 legs are cut to 12. A non-object reply gives `invalid_json`.
  - Cards: a domestic leg (Seoul to Busan) gives a city card only. A leg from Japan to Korea also gives a country card containing 韓国. A Taiwan card that says 南韓 for Korea is rejected with a reason. A leg to the home city uses the “going home” phrase.
  - Home: with home set, the three languages each get “I’m from” cards. With it empty, no such cards are made and the panel says so.
  - Saving: pressing “Make cards” twice adds nothing the second time. Unticked legs make no cards. Old saved data without `home` loads.
- `tools/validate.js` checks that `PLACE_NAMES` has exactly the six pairs, that each `nat` passes `tripScriptOK()` for its language and that `rom` and `say` are filled. All other tests pass, and `node tools/bundle.js` succeeds.
- With a real model, in the Claude-hosted copy, using the owner’s real timeline: list the legs found, the known-answer score and every accepted card, and read each card yourself for errors. Put this in your hand-off note.
- `docs/ARCHITECTURE.md` describes `state.home`, `js/nextstop.js` and `PLACE_NAMES`.

## Out of scope

- Finding stops anywhere but the timeline (the itinerary text box).
- Bare-name cards.
- Replacing old “I’m from” cards when home changes: the learner removes those with Remove.
- Languages other than the three in the course.

## Hand-off note

When finished, write a short note: what changed, anything you could not verify, and anything you noticed but left alone.
