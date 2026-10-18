const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
for (const [language, theme, width] of [
  ['tr', 'light', 1440],
  ['en', 'dark', 1440],
  ['tr', 'dark', 390],
  ['en', 'light', 320],
]) {
  test(`permanent navigation fills the screen without overlays or overflow ${language}/${theme}/${width}`, async ({
    page,
  }, info) => {
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
  });
}
