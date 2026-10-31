# U15a authoring notes

One non-engineer flow, driven end to end in `apps/web/e2e/author.spec.ts`
(chromium): open `/#/author`, pick the NCDPI id, enter the problem, keep the
checked misconceptions, read the live preview, download the file. The spec
saves exactly what the page rendered to this folder as `authored-lesson.json`.

The authored file is `author-shells-start`: Momo, take-from start-unknown,
ended with 15, gave away 9. The solver derived start 24, totals [24, 15],
answer 24. It passes the core boundary (`loadLesson` ok) and the story CLI
(`ok`) with zero console errors during the drive.

Where the numbers flow: teacher givens enter `AuthorDraft` in
`apps/web/src/author/author.ts`. `buildProblem` turns givens into a `Problem`.
`solve()` derives totals and answer. `buildStory` wraps the solved numbers in
code-owned question and reaction templates, then `validateStory` runs before
any output exists, so an invalid story throws instead of saving. `buildLesson`
adds the CC BY-SA 4.0 source record. The page previews with `fill()` and
downloads the same object the spec persisted.

Deferred on purpose: one story per file (no multi-story lessons yet), fixed
question ladders per kind (no custom teacher wording; templates stay
validator-clean by construction), short hero and item names (Pip's lines must
fit 45 characters after filling), and kind-aware pips only for echoed and
smaller-from-larger reactions. No network calls, no account, works offline
from the installed page.
