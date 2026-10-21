const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
async function openProfile(page, language = 'tr', theme = 'light', url = '/profile', width = 390) {
  await page.setViewportSize({ width, height: 900 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {
      username: 'elif',
      full_name: 'Elif Yılmaz',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      faculty_name: 'Teknik Bilimler Meslek Yüksekokulu',
      department_name: 'Bilgisayar Programcılığı',
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
    refresh_token: 'local_test_refresh',
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
  await page.route('**/auth/v1/**', (route) => {
    if (route.request().method() === 'PUT') {
      user.user_metadata = { ...user.user_metadata, ...route.request().postDataJSON().data };
      Object.assign(social.profile, {
        full_name: user.user_metadata.full_name,
        bio: user.user_metadata.bio || '',
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
  });
  const backend = [];
  page.on('request', (request) => {
    if (/\/rest\/v1\/|\/storage\/v1\/|\/functions\/v1\//.test(request.url())) backend.push(request.url());
  });
  const social = await mockSocial(page);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return social;
}
const png = () => ({
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
});
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`profile and edit layout/accessibility ${language}/${theme}`, async ({ page }, info) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) errors.push(message.text());
      });
      const backend = await openProfile(page, language, theme);
      await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
      await expect(page.locator('kx-social-post-card')).toHaveCount(6);
      await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`profile-${language}-${theme}.png`), fullPage: true });
      await page
        .getByRole('button', { name: language === 'tr' ? 'Profili Düzenle' : 'Edit Profile', exact: true })
        .click();
      await expect(page).toHaveURL(/\/profile\/edit$/);
      await expect(
        page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }),
      ).toBeDisabled();
      for (const id of ['profile-username', 'profile-campus'])
        await expect(page.locator('#' + id)).toHaveAttribute('readonly', '');
      for (const id of ['profile-university', 'profile-department'])
        await expect(page.locator('#' + id)).toHaveAttribute('readonly', '');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`profile-edit-${language}-${theme}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      expect(backend.requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toEqual([]);
    });
  }
test('permanent menu keeps profile navigation and unavailable items distinct', async ({ page }) => {
  await openProfile(page, 'tr', 'light', '/dashboard');
  const menu = page.locator('.profile-menu button[disabled]');
  await expect(menu).toHaveCount(4);
  await expect(page.locator('.profile-menu .compose-link')).toBeEnabled();
  for (let i = 0; i < 4; i++) {
    await expect(menu.nth(i)).toBeDisabled();
    await expect(page).toHaveURL(/\/dashboard$/);
  }
  await page.locator('.profile-content').getByRole('link', { name: 'Profil', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
  await page.locator('.profile-avatar-link').click();
  await expect(page).toHaveURL(/\/profile$/);
});
test('tabs filter kinds, keyboard navigation and sticky header follow scroll', async ({ page }) => {
  await openProfile(page);
  const tabs = page.getByRole('tab');
  await tabs.nth(1).click();
  await expect(page.locator('kx-social-post-card')).toHaveCount(0);
  await expect(page.locator('[data-kind=reply]')).toHaveCount(0);
  await tabs.nth(1).press('ArrowRight');
  await expect(page.locator('[data-kind=retweet]')).toHaveCount(0);
  await expect(tabs.nth(2)).toBeFocused();
  await tabs.nth(2).press('Home');
  await expect(page.locator('kx-social-post-card')).toHaveCount(6);
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await expect(page.locator('.profile-toolbar')).toHaveClass(/collapsed/);
  await expect(page.locator('.toolbar-identity')).toContainText('6 gönderi');
  expect((await page.locator('.profile-tabs').boundingBox()).y).toBeCloseTo(64, 0);
  const scroll = await page.locator('.tab-scroll').evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scroll).toBe(true);
});
test('save updates profile, own post cards, dashboard avatar and drawer immediately', async ({ page }) => {
  const backend = await openProfile(page, 'tr', 'light', '/profile/edit');
  await page.locator('#profile-name').fill('Elif Kampüs');
  await page.locator('#profile-bio').fill('Kod, kampüs ve yeni fikirler.');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  await page.locator('#profile-cover-file').setInputFiles(png());
  await expect(page.locator('.cover-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Elif Kampüs', exact: true })).toBeVisible();
  await expect(page.locator('.profile-bio')).toHaveText('Kod, kampüs ve yeni fikirler.');
  await expect(page.locator('kx-toast')).toContainText('Profilin güncellendi');
  await expect(page.locator('.post-author strong')).toHaveText(Array(6).fill('Elif Kampüs'));
  await expect(page.locator('.post-header kx-avatar img')).toHaveCount(6);
  await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
  await expect(page.locator('.avatar-button img')).toBeVisible();
  await expect(page.locator('.profile-content')).toContainText('Elif Kampüs');
  await expect(page.locator('.profile-avatar-link img')).toBeVisible();
  expect(backend.requests.filter((request) => request.storage && request.method === 'POST')).toHaveLength(2);
  const saved = backend.requests.find(
    (request) => request.table === 'profiles' && request.method === 'PATCH',
  );
  expect(Object.keys(saved.payload).sort()).toEqual(['avatar_url', 'banner_url']);
  expect(saved.payload.avatar_url).toContain(`/uploads/${backend.profile.user_id}/avatar/`);
  expect(saved.payload.banner_url).toContain(`/uploads/${backend.profile.user_id}/banner/`);
  await page.reload();
  await expect(page.locator('.avatar-button img')).toBeVisible();
});
test('cancel protects unsaved text and image drafts and does not commit discarded changes', async ({
  page,
}) => {
  await openProfile(page, 'tr', 'light', '/profile/edit');
  await page.locator('#profile-name').fill('Unsaved name');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Düzenlemeye devam et' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#profile-name')).toHaveValue('Unsaved name');
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await page.getByRole('button', { name: 'Değişiklikleri sil', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
  await expect(page.locator('.large-avatar img')).toHaveCount(0);
});
test('invalid images show localized errors and names/bios enforce counters and required validation', async ({
  page,
}) => {
  await openProfile(page, 'tr', 'dark', '/profile/edit');
  await page
    .locator('#profile-avatar-file')
    .setInputFiles({ name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.locator('#profile-avatar-file-error')).toContainText('JPG, PNG veya WEBP');
  await page
    .locator('#profile-cover-file')
    .setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.locator('#profile-cover-file-error')).toContainText('20 MB');
  await page
    .locator('#profile-avatar-file')
    .setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('#profile-avatar-file-error')).toContainText('okunamadı');
  await page.locator('#profile-name').fill(' ');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.locator('#profile-name')).toBeFocused();
  await expect(page.locator('#profile-name')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#profile-name').fill('Elif');
  await expect(page.locator('#profile-name-counter')).toHaveText('4 / 50');
  await page.locator('#profile-bio').fill('a'.repeat(160));
  await expect(page.locator('#profile-bio-counter')).toHaveText('160 / 160');
  await page.locator('kx-language-switcher button[lang=en]').click();
  await expect(page.locator('#profile-cover-file-error')).toContainText('20 MB');
});
test('desktop column, live locale/theme and reduced motion keep user content intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openProfile(page, 'tr', 'light', '/profile', 1440);
  const width = await page.locator('.social-content').evaluate((element) => element.clientWidth);
  expect((await page.locator('.profile-shell').boundingBox()).width).toBe(width);
  expect(width).toBeGreaterThan(760);
  await page.locator('kx-language-switcher button[lang=en]').click();
  await expect(page).toHaveTitle('Profile — KampüsX');
  await expect(page.getByRole('tab', { name: 'Reposts', exact: true })).toBeVisible();
  await expect(page.locator('.post-text').first()).toContainText('Server post');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.locator('.indicator').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe(
    '0s',
  );
  await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
});
