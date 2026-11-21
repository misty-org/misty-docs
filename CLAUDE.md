# misty-docs

The Misty docs site. It writes no guides of its own for code in other repositories: each repository keeps the docs
for its own code and `src/sources.ts` is the one place that reads them (`misty-sdk/docs`, `misty-ui/DESIGN.md`).
Everything is drawn from `@misty/ui` and follows its `DESIGN.md`.

- Never run tests, typechecks, lint or the dev server after a change; the person tests it.
- Commits carry no AI attribution.
