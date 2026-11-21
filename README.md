# Misty docs

The docs site for Misty. It pulls each repository's own docs in at build time and draws them with `@misty/ui`:

| Section | Source |
| --- | --- |
| Introduction, Getting started, Features, Account, Self-hosting, Server env files, Reference | `content/<section>/<page>.md` here (front matter: `title`, `order`) |
| SDK | `../misty-sdk/docs/*.md` (front matter: `title`, `order`) |
| Design system | `../misty-ui/DESIGN.md` |
| Components | `../misty-ui/site/content.ts`: each component's live example, props and guidance, as misty-ui builds them |

`src/sources.ts` is the one place that names a source.

```bash
npm install
npm run dev     # http://127.0.0.1:5192
npm run build   # writes dist/, plain static files
```

The user docs were converted from `misty-website/src/pages/Docs/`. Pages link to each other as `#/<section>/<page>`.
The plan and level numbers in `content/account/plans.md` and `content/reference/space-levels.md` are copied from
`misty-website/src/pages/Pricing/plans.ts`; change them together.

Still to come: pointing `docs.mistysys.com` here.
