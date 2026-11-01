# Romain Rochegude — professional website

[![Validate](https://github.com/RoRoche/roroche.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/RoRoche/roroche.github.io/actions/workflows/ci.yml)
[![Publish to GitHub Pages](https://github.com/RoRoche/roroche.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/RoRoche/roroche.github.io/actions/workflows/deploy.yml)
![We recommend IntelliJ IDEA](https://www.elegantobjects.org/intellij-idea.svg)

A static, English-language Astro site for software architecture, quality, automation and technical leadership. Dark visual identity, self-hosted Roboto, responsive layouts and no first-party browser JavaScript. Talk slides use a lazy-loaded Notist iframe; its interactive player runs third-party JavaScript inside the frame. Articles use Shiki syntax highlighting and permanent, topic-filtered pages.

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
npm test
npm run check
npm run build
npm run preview
```

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

## Maintenance

`mise.toml` pins Node 24. `package-lock.json` locks npm dependencies. Renovate covers npm, GitHub Actions and mise using its recommended presets; install/enable the Renovate GitHub App for this repository. CI validates pull requests and `main`. Deployment is limited to `main` and explicit workflow events; pull requests never deploy.

Deployment reference: [GitHub Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
