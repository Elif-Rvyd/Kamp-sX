const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const { mockSocial } = require('./mock-social.cjs');
for (const [language, theme, width] of [
  ['tr', 'light', 1440],
  ['en', 'dark', 1440],
  ['tr', 'dark', 390],
  ['en', 'light', 320],
]) {
  test(`permanent navigation fills the screen without overlays or overflow ${language}/${theme}/${width}`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await openSocial(page, language, theme, '/dashboard', width);
    const sidebar = page.locator('.profile-content');
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const menu = document.querySelector('kx-dashboard-profile-drawer').getBoundingClientRect();
      const feed = document.querySelector('.dashboard-shell').getBoundingClientRect();
      return {
        menu: { x: menu.x, width: menu.width },
        feed: { x: feed.x, right: feed.right },
        viewport: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.menu.x).toBe(0);
    expect(Math.abs(geometry.feed.x - geometry.menu.width)).toBeLessThanOrEqual(1);
    // The global scrollbar contract reserves stable gutter space on owned scroll surfaces.
    expect(geometry.viewport - geometry.feed.right).toBeGreaterThanOrEqual(0);
    expect(geometry.viewport - geometry.feed.right).toBeLessThanOrEqual(20);
    expect(geometry.overflow).toBe(false);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`social-layout-${width}-${language}-${theme}.png`),
      fullPage: true,
    });
    const profile = sidebar.getByRole('link', {
      name: language === 'tr' ? 'Profil' : 'Profile',
      exact: true,
    });
    await profile.click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(profile).toHaveAttribute('aria-current', 'page');
    await expect(sidebar).toBeVisible();
    await sidebar
      .getByRole('button', { name: language === 'tr' ? 'Paylaş' : 'Publish', exact: true })
      .click();
    await expect(page).toHaveURL(/\/compose$/);
    await expect(sidebar).toBeVisible();
    const routes = [
      ['/compose', '.compose-page'],
      ['/profile/edit', '.edit-shell'],
      ['/settings', '.page'],
      ['/settings/archive', '.page'],
      ['/settings/bookmarks', '.page'],
      ['/settings/blocked', '.page'],
      ['/search', '.page'],
      ['/profile/followers', '.page'],
      ['/profile/following', '.page'],
      ['/profile/requests', '.page'],
      ['/posts/44444444-4444-4444-8444-000000000001', '.page'],
    ];
    for (const [route, selector] of routes) {
      await page.goto(route);
      await expect(page.locator(selector)).toBeVisible();
      const bounds = await page.evaluate((selector) => {
        const content = document.querySelector('.social-content').getBoundingClientRect();
        const surface = document.querySelector(selector).getBoundingClientRect();
        return {
          delta: Math.abs(content.width - surface.width),
          left: Math.abs(content.x - surface.x),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      }, selector);
      expect(bounds.delta, route).toBeLessThanOrEqual(1);
      expect(bounds.left, route).toBeLessThanOrEqual(1);
      expect(bounds.overflow, route).toBe(false);
    }
  });
}

test('missing icon font cannot expand the full-width settings page', async ({ page }) => {
  await openSocial(page, 'en', 'dark', '/settings', 1440);
  // Force descriptive ligature names to render as normal text, as with an unavailable font.
  await page.addStyleTag({ content: '.material-symbols-outlined { font-family: Arial !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const icon = page.locator('.list-link kx-icon .material-symbols-outlined').last();
  const bounds = await icon.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: element.getBoundingClientRect().width,
      size: parseFloat(style.fontSize),
      overflow: style.overflow,
    };
  });
  expect(bounds.width).toBe(bounds.size);
  expect(bounds.overflow).toBe('hidden');
});

for (const [language, theme, width] of [
  ['en', 'dark', 1920],
  ['tr', 'light', 390],
]) {
  test(`public and auth pages use available viewport width ${language}/${theme}/${width}`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(
      ({ language, theme }) => {
        localStorage.setItem('kampusx-language', language);
        localStorage.setItem('kampusx-theme', theme);
      },
      { language, theme },
    );
    await mockSocial(page);
    for (const route of [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/update-password',
      '/missing-page',
    ]) {
      await page.goto(route);
      await expect(page.locator('main .page-container').first()).toBeVisible();
      const size = await page.evaluate(() => ({
        widths: [...document.querySelectorAll('main .page-container')].map(
          (element) => element.getBoundingClientRect().width,
        ),
        viewport: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      for (const actual of size.widths)
        expect(actual, route).toBeGreaterThan(size.viewport - (width > 1150 ? 100 : 52));
      expect(size.overflow, route).toBe(false);
      if (width === 1920 && ['/', '/auth/login'].includes(route))
        await page.screenshot({
          path: info.outputPath(route === '/' ? 'welcome-full-width.png' : 'login-full-width.png'),
          fullPage: true,
        });
    }
  });
}
