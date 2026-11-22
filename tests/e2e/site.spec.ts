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

for (const path of [
  '/',
  '/articles/',
  '/open-source/',
  '/talks/',
  '/book/',
  '/about/',
]) {
  test(`has no axe WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(sitePath(path));

    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('embedded talk slides have an accessible title', async ({ page }) => {
  await page.goto(sitePath('/talks/'));
  await expect(page.locator('iframe')).toHaveAttribute('title', /slides/);
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
