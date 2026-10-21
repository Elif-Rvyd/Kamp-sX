const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const profile = (user_id, username, full_name, is_private = true) => ({
  user_id,
  username,
  full_name,
  is_private,
  avatar_url: null,
  banner_url: null,
  university: 'Kırşehir Ahi Evran Üniversitesi',
  studying: 'Bilgisayar Programcılığı',
});
const people = () => [profile(B, 'deniz', 'Deniz Yıldız'), profile(C, 'ece', 'Ece Öğrenci', false)];
const searches = (state) =>
  state.requests.filter(
    (r) =>
      r.table === 'profiles' && Object.values(r.filters ?? {}).some((value) => value.startsWith('ilike.')),
  );

test('typing searches usernames/names and posts without a submit button; clear cancels immediately and restores focus', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/search', 390, { people: people(), connections: [] });
  state.posts[0].content = 'Deniz campus conversation';
  const input = page.getByLabel('Search people or posts', { exact: true });
  await expect(page.locator('form[role=search] button[type=submit]')).toHaveCount(0);
  await input.pressSequentially('den', { delay: 40 });
  expect(searches(state)).toHaveLength(0);
  const result = page.locator('kx-follow-person');
  await expect(result).toHaveCount(1);
  await expect(result).toContainText('Deniz Yıldız');
  await expect(page.locator('kx-social-post-card')).toHaveCount(1);
  await expect(page).toHaveURL(/q=den/);
  await input.fill('Yıldız');
  await expect(result).toContainText('@deniz');
  await input.fill('@ece');
  await expect(result).toContainText('@ece');
  await expect(result).not.toContainText('@deniz');
  const clear = page.getByRole('button', { name: 'Clear search', exact: true });
  await clear.focus();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.locator('kx-follow-person,kx-social-post-card')).toHaveCount(0);
  await expect(page).toHaveURL(/\/search$/);
});

test('Enter commits immediately and @, percent, underscore and filter punctuation stay literal', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/search', 1440, { people: people() });
  const input = page.locator('#post-search');
  await input.fill('deniz');
  await input.press('Enter');
  await expect(page.locator('kx-follow-person')).toContainText('@deniz');
  state.people.push(profile('55555555-5555-4555-8555-555555555555', 'literal_100%', 'Literal, (name)."'));
  await input.fill('100%');
  await expect(page.locator('kx-follow-person')).toContainText('literal_100%');
  await input.fill(', (name)."');
  await expect(page.locator('kx-follow-person')).toContainText('literal_100%');
  await input.fill('nobody');
  await expect(page.getByRole('heading', { name: 'No matching people', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No matching posts', exact: true })).toBeVisible();
});

test('search results reuse real follow/request controls and blocked profiles disappear on invalidation', async ({
  page,
}) => {
  const state = await openSocial(page, 'tr', 'dark', '/search?q=den', 390, {
    people: people(),
    connections: [],
  });
  const row = page.locator('kx-follow-person');
  await row.getByRole('button', { name: 'Takip et', exact: true }).click();
  await expect(row.getByRole('button', { name: 'İsteği iptal et', exact: true })).toBeVisible();
  expect(state.follows[0].status).toBe('pending');
  await row.getByRole('button', { name: 'İsteği iptal et', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Takip et', exact: true })).toBeVisible();
  expect(state.follows).toHaveLength(0);
  state.blocks.push({ blocker_id: '11111111-1111-4111-8111-111111111111', blocked_id: B });
  state.broadcastFollows();
  await expect(row).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Eşleşen kullanıcı bulunamadı', exact: true }),
  ).toBeVisible();
});

test('superseded searches cannot repopulate results while typing, clearing or leaving the page', async ({
  page,
}) => {
  await openSocial(page, 'en', 'light', '/search', 390, { people: people() });
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let started;
  const waiting = new Promise((resolve) => (started = resolve));
  await page.route('**/rest/v1/profiles?**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.searchParams.get('username')?.startsWith('ilike.%den')) return route.fallback();
    started();
    await gate;
    await route
      .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ user_id: B }]) })
      .catch(() => {});
  });
  const input = page.locator('#post-search');
  await input.fill('den');
  await waiting;
  await input.fill('ece');
  await expect(page.locator('kx-follow-person')).toHaveCount(0);
  await expect(page.locator('kx-follow-person')).toContainText('@ece');
  release();
  await expect(page.locator('kx-follow-person')).not.toContainText('@deniz');
  await input.fill('den');
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.locator('kx-follow-person')).toHaveCount(0);
  await input.fill('ece');
  await page.locator('.sidebar-brand').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('IME composition cancels queued work; results are requested only after composition completes', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/search', 390, { people: people() });
  const input = page.locator('#post-search');
  await input.dispatchEvent('compositionstart');
  await input.fill('den');
  await input.press('Enter');
  await page.waitForTimeout(400);
  expect(searches(state)).toHaveLength(0);
  await input.dispatchEvent('compositionend');
  await expect(page.locator('kx-follow-person')).toContainText('@deniz');
});

test('a people read failure preserves post results and offers retry without exposing backend details', async ({
  page,
}) => {
  await openSocial(page, 'en', 'dark', '/search', 390, { people: people() });
  await page.route('**/rest/v1/profiles?**', async (route) => {
    if (!new URL(route.request().url()).searchParams.get('full_name')?.startsWith('ilike.'))
      return route.fallback();
    return route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'PRIVATE_ERROR_MARKER', code: '42501' }),
    });
  });
  await page.locator('#post-search').fill('Server');
  await expect(page.getByRole('alert')).toContainText('Could not search people');
  await expect(page.locator('kx-social-post-card')).toHaveCount(6);
  await expect(page.locator('body')).not.toContainText('PRIVATE_ERROR_MARKER');
  await page.unroute('**/rest/v1/profiles?**');
  await page.getByRole('alert').getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No matching people', exact: true })).toBeVisible();
});

for (const [locale, theme, width] of [
  ['tr', 'light', 320],
  ['tr', 'dark', 390],
  ['en', 'light', 390],
  ['en', 'dark', 1440],
]) {
  test(`people/post search is accessible and keeps layout in ${locale}/${theme}/${width}`, async ({
    page,
  }, info) => {
    await openSocial(page, locale, theme, '/search?q=den', width, { people: people(), connections: [] });
    await expect(page.locator('kx-follow-person')).toContainText('Deniz Yıldız');
    await expect(page.locator('kx-follow-person button')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clear = page.getByRole('button', {
      name: locale === 'tr' ? 'Aramayı temizle' : 'Clear search',
      exact: true,
    });
    const box = await clear.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath(`search-${locale}-${theme}.png`), fullPage: true });
  });
}
