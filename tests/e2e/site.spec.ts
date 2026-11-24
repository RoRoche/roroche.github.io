import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const basePath = (process.env.BASE_PATH ?? '/').replace(/\/+$/, '');
const sitePath = (path: string) => `${basePath}${path}`;

test('main navigation works and marks the current page', async ({ page }) => {
  await page.goto(sitePath('/'));

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(/\/about\/$/);
  await expect(
    page.getByRole('heading', { name: 'Hi, I’m Romain.' }),
  ).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'About' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('theme can be switched and is remembered after reload', async ({
  page,
}) => {
  await page.goto(sitePath('/'));

  const toggle = page.getByRole('button', { name: 'Switch to light theme' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(
    page.getByRole('button', { name: 'Switch to dark theme' }),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(247, 249, 252)',
  );

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('theme control fits the tablet navigation without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(sitePath('/'));

  await expect(
    page.getByRole('button', { name: 'Switch to light theme' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test('article topic filters navigate without JavaScript', async ({ page }) => {
  await page.goto(sitePath('/articles/'));

  const filters = page.getByRole('navigation', {
    name: 'Filter articles by topic',
  });
  await filters.getByRole('link', { name: /Testing/ }).click();

  await expect(page).toHaveURL(/\/articles\/category\/testing\/$/);
  await expect(page.getByRole('heading', { name: 'Testing.' })).toBeVisible();
});

test('skip link is the first keyboard stop and targets main content', async ({
  page,
}) => {
  await page.goto(sitePath('/'));
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

const accessibilityPaths = [
  '/',
  '/articles/',
  '/open-source/',
  '/talks/',
  '/book/',
  '/about/',
];

for (const path of accessibilityPaths) {
  test(`has no axe WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(sitePath(path));

    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('light theme has no axe WCAG A/AA violations', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('site-theme', 'light'));
  for (const path of accessibilityPaths) {
    await page.goto(sitePath(path));

    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  }
});

test('embedded talk slides have an accessible title', async ({ page }) => {
  await page.goto(sitePath('/talks/'));
  await expect(page.locator('iframe')).toHaveAttribute('title', /slides/);
});

test('public pages expose consistent SEO metadata', async ({ page }) => {
  for (const path of [
    '/',
    '/articles/',
    '/open-source/',
    '/talks/',
    '/book/',
    '/about/',
  ]) {
    await page.goto(sitePath(path));

    const siteUrl = process.env.SITE_URL ?? 'https://roroche.github.io';
    const canonical = new URL(path, siteUrl).href;
    await expect(page).toHaveTitle(/\S+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /\S+/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonical,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /\S+/,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      canonical,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\//,
    );
  }
});

test('sitemap is served and lists the configured site', async ({ request }) => {
  const response = await request.get(sitePath('/sitemap-index.xml'));
  expect(response.ok()).toBeTruthy();
  const siteUrl = process.env.SITE_URL ?? 'https://roroche.github.io';
  expect(await response.text()).toContain(
    new URL('/sitemap-0.xml', siteUrl).href,
  );
});

test('internal links resolve to generated pages and assets', async ({
  page,
  request,
}) => {
  const paths = [
    '/',
    '/articles/',
    '/articles/category/testing/',
    '/open-source/',
    '/talks/',
    '/book/',
    '/about/',
  ];
  const internalLinks = new Set<string>();

  for (const path of paths) {
    await page.goto(sitePath(path));
    for (const href of await page
      .locator('a[href]')
      .evaluateAll((anchors) =>
        anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
      )) {
      const link = new URL(href);
      if (link.origin === new URL(page.url()).origin) {
        link.hash = '';
        internalLinks.add(link.href);
      }
    }
  }

  for (const link of internalLinks) {
    const response = await request.get(link);
    expect(response.status(), `Broken internal link: ${link}`).toBeLessThan(
      400,
    );
  }
});

test('home hero matches the desktop visual baseline', async ({ page }) => {
  await page.goto(sitePath('/'));
  await expect(page.locator('.hero')).toHaveScreenshot('home-hero-desktop.png');
});

test('home hero matches the mobile visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(sitePath('/'));
  await expect(page.locator('.hero')).toHaveScreenshot('home-hero-mobile.png');
});

test('about introduction matches the visual baseline', async ({ page }) => {
  await page.goto(sitePath('/about/'));
  await expect(page.locator('.about-intro')).toHaveScreenshot(
    'about-intro-desktop.png',
  );
});
