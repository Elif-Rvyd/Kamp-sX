const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openDashboard(page, language = 'tr', theme = 'light', width = 390) {
  await page.setViewportSize({ width, height: width > 640 ? 900 : 844 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      username: 'elif',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      department_name: 'Bilgisayar Teknolojileri',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh_token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    }),
  );
  await mockSocial(page);
  await page.goto('/dashboard');
  await expect(
    page.getByRole('tab', { name: language === 'tr' ? 'Keşfet' : 'Explore', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.evaluate(() => document.fonts.ready);
}

async function swipe(page, from, to) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: from.x, y: from.y }],
  });
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

async function settledDrawer(page) {
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => page.getByRole('dialog').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
}

for (const language of ['tr', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`dashboard geometry and accessibility — ${language}/${theme}`, async ({ page }, info) => {
      await openDashboard(page, language, theme, language === 'en' ? 320 : 1440);
      await expect(page.locator('kx-header, kx-footer')).toHaveCount(0);
      await expect(page.getByRole('tab')).toHaveCount(4);
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect(page.locator('.bottom-nav button')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const surface = await page.locator('.dashboard-shell').evaluate((el) => ({
        actual: getComputedStyle(el).backgroundColor,
        expected: getComputedStyle(document.documentElement).getPropertyValue('--color-surface'),
      }));
      expect(surface.actual).not.toBe('rgba(0, 0, 0, 0)');
      expect(surface.expected.trim()).not.toBe('');
      const audit = await new AxeBuilder({ page }).analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`dashboard-${language}-${theme}.png`) });
      const opener = page.getByRole('button', {
        name: language === 'tr' ? 'Profil menüsünü aç' : 'Open profile menu',
      });
      await opener.click();
      const dialog = page.getByRole('dialog');
      await settledDrawer(page);
      await expect(dialog.getByText('@elif', { exact: true })).toBeVisible();
      await expect(dialog.locator('.profile-details p')).toHaveCount(2);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`drawer-${language}-${theme}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }
}

test('tabs, keyboard and content use one selection state', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  await tabs.nth(2).click();
  await expect(page.getByRole('heading', { name: 'Kampüsünün gündemi' })).toBeVisible();
  await tabs.nth(2).press('ArrowRight');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(3).press('Home');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).press('End');
  await expect(page.getByRole('heading', { name: 'Bölümündeki konuşmalar' })).toBeVisible();
  await tabs.nth(3).press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
});

test('real touch swipes change feeds, clamp boundaries and preserve vertical scroll', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  for (const expected of [1, 2, 3, 3]) {
    await swipe(page, { x: 300, y: 530 }, { x: 85, y: 538 });
    await expect(tabs.nth(expected)).toHaveAttribute('aria-selected', 'true');
  }
  await swipe(page, { x: 85, y: 530 }, { x: 300, y: 538 });
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await swipe(page, { x: 200, y: 630 }, { x: 205, y: 350 });
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('drawer traps focus, locks scroll and closes on backdrop or touch', async ({ page }) => {
  await openDashboard(page);
  const opener = page.getByRole('button', { name: 'Profil menüsünü aç' });
  await opener.click();
  await settledDrawer(page);
  const close = page.getByRole('button', { name: 'Profil menüsünü kapat' });
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  await close.press('Shift+Tab');
  const profileEntry = page.locator('.profile-avatar-link');
  await expect(profileEntry).toBeFocused();
  await profileEntry.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Çıkış yap', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(profileEntry).toBeFocused();
  const drawerBounds = await page.getByRole('dialog').boundingBox();
  const backdropX = drawerBounds.x + drawerBounds.width + 8;
  await page.mouse.click(backdropX, 300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await opener.click();
  await swipe(page, { x: 270, y: 245 }, { x: 70, y: 250 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('theme and language remain live without resetting the selected feed', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('tab', { name: 'Bölüm', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Department', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page).toHaveTitle('Home — KampüsX');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('heading', { name: 'Inside your department' })).toBeVisible();
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await expect(page.getByRole('dialog').getByText('Bilgisayar Teknolojileri', { exact: true })).toBeVisible();
});

test('reduced motion and unavailable visual controls have no business effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDashboard(page);
  expect(
    await page.locator('.discover-track').evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  for (const button of await page.locator('.bottom-nav button').all()) {
    await expect(button).toBeDisabled();
  }
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  for (const button of await page.locator('.profile-menu button[aria-disabled=true]').all())
    await expect(button).toBeDisabled();
  await page.getByRole('button', { name: 'Profil menüsünü kapat' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('leaving an open drawer restores the welcome and auth shell', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.evaluate(() => {
    history.pushState({}, '', '/auth/forgot-password');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('kx-header')).toBeVisible();
  await expect(page.locator('kx-footer')).toBeVisible();
  await expect(page.locator('#reset-email')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await page.goto('/');
  await expect(page.locator('.hero-poster')).toBeVisible();
  await expect(page.locator('kx-header')).toBeVisible();
});
