# Eight weeks to Taiwan, Korea and Tokyo

A self-paced web app for learning travel Mandarin, Korean and Japanese from zero, about ten minutes a day.

- **255 flashcards** across three languages, each with native script, a plain-English “sounds like” spelling, standard romanization and audio.
- **One language at a time:** Mandarin in weeks 1 to 3, Korean in weeks 4 to 6, a Japanese crash course in week 7, mixed review in week 8.
- **Spaced repetition:** cards you get right return after 1, 2, 4, 8 and 16 days; cards you miss return the next day.
- **Hangul lab:** the Korean alphabet in three sets with memory hooks, a syllable-block builder, and a drill for sounding out real menu and sign words.
- **Essentials:** hello, goodbye, yes, no, sorry, excuse me, please and thank you in each language, always one tap away.
- **Phrasebook and customs:** everything searchable for use on the trip, plus etiquette notes per country.

## Use it

Open `index.html` in a browser. There is nothing to install and no build step.

Dish photos come from Wikimedia Commons and carry their own licenses, listed with author and source on the Photo credits page (linked from the footer).

Progress is saved in your browser. Audio uses your device’s built-in text-to-speech voices, so quality varies and a language may be missing on some devices.

## About the content

The cards, pronunciation spellings and notes were written with Claude (Anthropic’s AI model) and have **not been reviewed by native speakers**. The “sounds like” spellings are approximations for English speakers. Corrections are welcome: open an issue or a pull request.

## Project layout

```
index.html            page shell; lists the scripts in load order
css/styles.css        all styles, light and dark themes
js/data/              course content: one file per language, plus course structure, Hangul data and dish photo credits
images/dishes/        dish photos, one JPEG per card id
js/cards.js           turns the data rows into card objects
js/core.js            saved progress, helpers, audio
js/ai.js              asks Claude for JSON, in either place the site runs
js/tripcheck.js       the checks behind “Your trip” cards
js/views/             one file per screen
js/main.js            router and event handling
tools/validate.js     checks the course data
tools/test-trip.js    tests the trip-card checks against a scripted model
tools/bundle.js       builds a single-file copy (dist/claude.html)
docs/                 architecture notes, hosting steps, and specs for planned work
```

After any change, run `node tools/validate.js` and `node tools/test-trip.js`. See `docs/ARCHITECTURE.md` before contributing and `docs/specs/` for what is planned.

## How it was built

Designed and directed by Adam Hare; implemented with Claude.

## License

MIT. See [LICENSE](LICENSE).
