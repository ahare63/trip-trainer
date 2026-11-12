# Planned work

Each spec is written to be handed to a fresh agent together with `docs/ARCHITECTURE.md`. Specs 01 to 05 are independent of each other and can be done in any order or in parallel. Model suggestions are starting points: `tools/validate.js` is the safety net, so try the suggested model and move up only if the checks fail.

| Spec | Task | Depends on | Suggested model |
|---|---|---|---|
| 01 | Signs drawn as signs | none | Haiku 5.5 |
| 02 | Tone contours on Mandarin cards | none | Haiku 5.5 |
| 03 | Situation labels on phrase cards | none | Haiku 5.5 |
| 04a | Breakdown data | none | Opus 5.5, plus a second-model review |
| 04b | Breakdown display | 04a | Haiku 5.5 |
| 05 | Dish photos from Wikimedia Commons | none | Sonnet 5.5 with web access |
| 06 | Trip decks with a checking step | none | Fable 5.2, fresh context |
| 07a | Add a place by hand | 06 | Sonnet 5.5 |
| 07b | Quick add | 06 | Sonnet 5.5 |
| 07c | Read a booking screenshot | 06, 07a | Opus 5.5 |
| 08 | Typed conversation partner | 06 | Opus 5.5 |

Several specs add a script to `index.html` and a check to `tools/validate.js`. If two are done in parallel, expect small merge conflicts in those two files.
