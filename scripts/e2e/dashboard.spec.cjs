const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
async function swipe(page, from, to) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let step = 1; step <= 5; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 5, y: from.y + ((to.y - from.y) * step) / 5 }],
    });
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}
test('tabs, keyboard and content use one selection state', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/dashboard');
  const tabs = page.getByRole('tab');
  await tabs.nth(2).click();
  await expect(page.getByRole('heading', { name: 'Kampüsünün gündemi' })).toBeVisible();
  await tabs.nth(2).press('ArrowRight');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(3).press('Home');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).press('End');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(3).press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
});
test('touch swipes change feeds while vertical document scrolling stays available', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/dashboard');
  const tabs = page.getByRole('tab');
  for (const index of [1, 2, 3, 3]) {
    await swipe(page, { x: 300, y: 530 }, { x: 85, y: 538 });
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
  }
  await swipe(page, { x: 85, y: 530 }, { x: 300, y: 538 });
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await swipe(page, { x: 200, y: 630 }, { x: 205, y: 350 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  expect((await page.locator('kx-dashboard-profile-drawer').boundingBox()).y).toBe(0);
});
test('permanent navigation never opens a dialog or locks page scrolling', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/dashboard', 1440);
  await expect(page.locator('.profile-content')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.profile-content')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  const profile = page.locator('.profile-content').getByRole('link', { name: 'Profil', exact: true });
  await profile.focus();
  await profile.press('Enter');
  await expect(page).toHaveURL(/\/profile$/);
});
test('theme and language stay live without resetting the selected feed', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/dashboard', 1440);
  await page.getByRole('tab', { name: 'Bölüm', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Department', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page).toHaveTitle('Home — KampüsX');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(
    page.locator('.profile-content').getByRole('link', { name: 'Profile', exact: true }),
  ).toBeVisible();
});
test('reduced motion and unavailable actions preserve their contracts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSocial(page, 'tr', 'dark', '/dashboard');
  expect(
    await page.locator('.discover-track').evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  for (const button of await page.locator('.profile-menu button:not(.compose-link)').all())
    await expect(button).toBeDisabled();
  await expect(page.locator('.compose-link')).toBeEnabled();
  await expect(page).toHaveURL(/\/dashboard$/);
});
test('public auth and welcome routes retain their own header/footer without the social sidebar', async ({
  page,
}) => {
  await openSocial(page, 'tr', 'light', '/dashboard');
  await page.evaluate(() => {
    history.pushState({}, '', '/auth/forgot-password');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('kx-header')).toBeVisible();
  await expect(page.locator('kx-footer')).toBeVisible();
  await expect(page.locator('.profile-content')).toHaveCount(0);
  await page.goto('/');
  await expect(page.locator('.hero-poster')).toBeVisible();
});
