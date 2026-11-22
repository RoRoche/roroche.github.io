# Romain Rochegude — professional website

[![Validate](https://github.com/RoRoche/roroche.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/RoRoche/roroche.github.io/actions/workflows/ci.yml)
[![Publish to GitHub Pages](https://github.com/RoRoche/roroche.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/RoRoche/roroche.github.io/actions/workflows/deploy.yml)
![We recommend IntelliJ IDEA](https://www.elegantobjects.org/intellij-idea.svg)

A static, English-language Astro site for software architecture, quality, automation and technical leadership. Dark visual identity, self-hosted Roboto, responsive layouts and minimal browser JavaScript for analytics. Talk slides use a lazy-loaded Notist iframe; its interactive player runs third-party JavaScript inside the frame. Articles use Shiki syntax highlighting and permanent, topic-filtered pages.

## Local development

```sh
mise install
npm ci
npm run sync:articles            # clones RoRoche/articles at its current main
npm run dev
```

Use a local articles checkout without a network request:

```sh
npm run sync:articles -- ../articles
```

Content is generated explicitly before a build, rather than fetched by the browser. `npm run build` also works without imported articles and displays an honest empty state. Generated articles and assets are ignored by Git.

```sh
npm run validate                # all quality checks, then the production build
npm run preview
```

## Quality checks and commit hooks

`npm ci` installs the Husky pre-commit hook through the `prepare` script. Every commit checks staged whitespace errors, then runs the full project validation:

1. **ESLint and Stylelint**: JavaScript, TypeScript, Astro accessibility rules and the global stylesheet. Warnings fail validation.
2. **Editorial contract**: article import tests verify publication metadata, permanent source links, categories, draft privacy and rewritten assets. `textlint`/`write-good` checks published articles for repeated words, sentence-initial “So” and clichés; subjective style checks are disabled to avoid false positives in technical prose.
3. **Prettier and Astro Check**: check formatting, Astro components and TypeScript types.
4. **Unit tests, V8 coverage and Knip**: Node's built-in test runner covers article import and analytics with minimum 85% line/function and 70% branch coverage; Knip detects unused files, exports and dependencies.
5. **Dependency security**: CI runs `npm audit` and blocks high/critical advisories. OSV-Scanner checks new vulnerabilities on pull requests and performs a scheduled full scan; CodeQL analyzes JavaScript/TypeScript; Gitleaks scans repository history for secrets.
6. **Build and generated HTML**: generates the static site, then `html-validate` checks the HTML Astro actually emits.
7. **Browser, SEO and performance**: Playwright tests UI, internal links, canonical/Open Graph metadata and the sitemap; axe checks WCAG A/AA; screenshot baselines catch visual regressions; Lighthouse CI runs three audits per representative page with minimum scores of 85 performance, 95 accessibility, 95 SEO and 90 best practices.
8. **External links**: Lychee checks README and published-article links weekly, separately from deployment so third-party outages do not block a release.

Run `npm run sync:articles` before `npm run lint:prose` or `npm run quality` to validate the latest published articles. `npm run quality` runs local source checks and tests; `npm run audit:dependencies` runs the npm registry audit separately. `npm run validate` runs the complete local sequence including the production build, generated HTML, browser checks and Lighthouse. To run browser tests separately, build the site first and install the browser with `npx playwright install chromium`, then run `npm run test:e2e`. Review screenshot changes and update baselines intentionally with `npx playwright test --update-snapshots`. Use `npm run format` and `npm run lint:fix` to apply supported fixes, review them and stage the resulting changes before committing again. Validation checks the entire working tree, including unstaged changes; it does not automatically stage or rewrite files.

The hook uses locally available articles and does not fetch content or require network access. Run `npm run sync:articles` first when you want to validate the latest published content. Generated content, dependencies and build output are excluded from source linting and formatting; Astro Check and the build still validate imported articles.

Both GitHub Actions workflows retrieve articles and run the same required checks in the pinned Playwright container. This keeps Chromium and system-font rendering consistent with the Linux screenshot baselines. Separate security workflows run CodeQL, OSV-Scanner and Gitleaks; a scheduled Lychee workflow checks external references. Husky installation is disabled in CI with `HUSKY=0`; the checks run directly in the workflows.

## Article source contract

The importer supports the existing `RoRoche/articles` layout:

```text
articles/
  permanent-article-slug/
    post.md
    header.png
    other-local-assets.png
```

```yaml
---
title: 'An article title'
description: 'A concise summary.'
status: published
published_at: 2026-10-29
tags: [java, software-architecture]
category: architecture
# Optional; otherwise the parent directory name becomes the URL.
slug: permanent-article-slug
# Optional; defaults to header.png.
image: header.png
---
```

Only `status: published` (or explicit `draft: false`) is published; an explicit draft marker always takes precedence. A publication date is mandatory. Drafts and undated work remain unpublished. Set `INCLUDE_DRAFTS=true` for local previews only; preview articles are marked and have `noindex`. Undated drafts display “Unpublished draft” in preview. Never enable this variable in production.

Categories are `architecture`, `testing`, `devops`, `leadership`. When omitted, the importer infers a category from tags and defaults to architecture. Keep a slug unchanged to preserve `/articles/<slug>/` permanently. The importer rejects duplicate or unsafe slugs. Each imported article gets its title, summary, date, image, tags and GitHub source link from the source metadata. Article-local Markdown images and attachment links are rewritten to local assets, including when using a base path. Use Markdown asset references and keep assets inside the article directory; external images must use HTTPS URLs. Raw HTML asset references are not rewritten.

Local article imagery is copied as supplied; optimize oversized images in the articles repository before publishing. The content source is trusted Markdown maintained by the site owner, not user-submitted content.

## GitHub Pages deployment

The site is configured for **https://roroche.github.io/**, using the user-site repository **RoRoche/roroche.github.io**. `SITE_URL` defaults to `https://roroche.github.io` and `BASE_PATH` defaults to `/`; no repository variable overrides are needed.

1. Push the code to `main` in the destination repository.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run **Publish to GitHub Pages**, or push to `main`.
4. Check the workflow's deployment URL before sharing the site.

No custom domain or `CNAME` is needed. The workflow imports the public `RoRoche/articles` repository at build time, validates the site, builds static output, uploads the Pages artifact, then deploys it using short-lived OIDC permissions. No personal access token is needed for article reads.

### Publishing updates from the articles repository

Deployments run on a website push, manual dispatch, a daily schedule (06:17 UTC), or a `repository_dispatch` event of type `articles-updated`. Every run checks out the current articles `main` branch. The daily schedule picks up article changes without configuring cross-repository credentials.

For immediate publication, the articles repository can send a repository dispatch to the website repository using a narrowly scoped GitHub App installation token or fine-grained token with the required destination repository permission. The articles repository's standard `GITHUB_TOKEN` does not grant cross-repository writes. Alternatively, run the website workflow manually after publishing an article.

## Editing the site

- `src/data/site.ts`: profile links, expertise and site metadata.
- `src/data/projects.ts`: project descriptions, technical choices and artifact coordinates.
- `src/pages/about.astro`: career narrative, based on the existing résumé.
- `src/pages/talks.astro`: first talk and teaching activity; add verified Slidev, demo and recording URLs when ready.
- `src/pages/book.astro`: book outline, manuscript status and related articles. No invented completion percentage or release date.
- `src/styles/global.css`: colors, typography, responsive styles and reduced-motion support.

Article filters are static links, so they work without JavaScript, are keyboard accessible and have shareable URLs. The site includes a skip link, visible keyboard focus, semantic headings, canonical links, social metadata, sitemap and a custom 404 page. The social card is served as a PNG for sharing compatibility; its editable SVG source is included.

The articles RSS 2.0 feed is available at `/rss.xml` and includes published articles only. Its URL is advertised in the page metadata and linked from the articles index.

## Maintenance

`mise.toml` pins Node 24. `package-lock.json` locks npm dependencies. Renovate covers npm, GitHub Actions and mise using its recommended presets; install/enable the Renovate GitHub App for this repository. CI validates pull requests and `main`. Deployment is limited to `main` and explicit workflow events; pull requests never deploy.

Deployment reference: [GitHub Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Analytics and public article counters

GoatCounter collects visits on production pages at `roroche.github.io`, using the account at https://roroche.goatcounter.com/. A small asynchronous tracker is loaded without an SDK or private API key. Development pages, draft-preview builds and pages marked `noindex` omit the integration. A hostname guard also prevents local previews of production output from loading the tracker or requesting counters.

Published article pages and cards display a discreet visit count next to the date. Enable **Allow adding visitor counts on your website** in the GoatCounter site settings; the rest of the dashboard can remain private. Counters use the full article path including the trailing slash, matching the site's canonical URLs. GoatCounter's default session deduplication means these are visits, not every page reload.

For an article not yet recorded, GoatCounter returns HTTP 404 with an explicit zero; the site displays that value as “0 visits”. The count stays hidden when public counters are disabled or the request is blocked, fails, or returns invalid data. It never substitutes a fabricated zero for an error. GoatCounter may cache public counts for up to four hours. See the [official counter documentation](https://www.goatcounter.com/help/visitor-counter).

The integration lives in `src/scripts/analytics.mjs`. Update its account origin and production hostname if the site moves. Statistics start after deployment; existing traffic is not reconstructed. Export history regularly from GoatCounter if you want an independent archive.
