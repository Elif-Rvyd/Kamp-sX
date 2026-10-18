const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const OWNER = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
const person = (id, username, is_private = true) => ({
  user_id: id,
  username,
  full_name: username === 'deniz' ? 'Deniz Öğrenci' : 'Ece Öğrenci',
  avatar_url: null,
  banner_url: null,
  university: 'Kırşehir Ahi Evran Üniversitesi',
  studying: 'Bilgisayar Programcılığı',
  bio: null,
  created_at: '2026-10-18T10:00:00Z',
  is_private,
});
const relation = (a, b, status = 'pending') => ({
  follower_id: a,
  following_id: b,
  status,
  created_at: '2026-10-18T10:00:00Z',
});
for (const [lang, theme, width] of [
  ['tr', 'light', 390],
  ['en', 'dark', 1440],
  ['tr', 'dark', 320],
  ['en', 'light', 390],
]) {
  test(`pending request accept, real counts, remove follower and keyboard navigation ${lang}/${theme}/${width}`, async ({
    page,
  }, info) => {
    const state = await openSocial(page, lang, theme, '/profile/requests', width, {
      connections: [relation(B, OWNER)],
      people: [person(B, 'deniz')],
    });
    const row = page.locator('.people-list kx-follow-person');
    await expect(row).toContainText('Deniz Öğrenci');
    const accept = page.getByRole('button', { name: lang === 'tr' ? 'Kabul et' : 'Accept', exact: true });
    await accept.focus();
    await page.keyboard.press('Enter');
    await expect(row).toHaveCount(0);
    await expect(page.locator('.connections-nav a[aria-current="page"]')).toBeFocused();
    expect(state.follows[0].status).toBe('accepted');
    expect(state.requests.find((r) => r.table === 'follows' && r.method === 'PATCH').payload).toEqual({
      status: 'accepted',
    });
    await page.locator('.connections-nav a').first().click();
    await expect(page).toHaveURL(/\/profile\/followers$/);
    await expect(page.locator('.people-list kx-follow-person')).toContainText('Deniz Öğrenci');
    await expect(page.locator('kx-dashboard-profile-drawer kx-follow-counts strong')).toHaveText(['0', '1']);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: info.outputPath(`connections-${lang}-${theme}-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: lang === 'tr' ? 'Takipçiyi çıkar' : 'Remove follower', exact: true })
      .click();
    await expect(page.locator('.people-list kx-follow-person')).toHaveCount(0);
    expect(state.follows).toHaveLength(0);
  });
}
test('exact username lookup follows private/public users, cancels requests and unfollows', async ({
  page,
}) => {
  const state = await openSocial(page, 'tr', 'light', '/profile/following', 390, {
    connections: [],
    people: [person(B, 'deniz'), person(C, 'ece', false)],
  });
  await page.getByLabel('Kullanıcı adıyla bul', { exact: true }).fill('deniz');
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  const result = page.getByRole('region', { name: 'Bulunan kullanıcı' });
  await result.getByRole('button', { name: 'Takip et', exact: true }).click();
  await expect(result.getByRole('button', { name: 'İsteği iptal et', exact: true })).toBeVisible();
  expect(state.follows[0].status).toBe('pending');
  expect(state.requests.find((r) => r.table === 'follows' && r.method === 'POST').payload).toEqual({
    follower_id: OWNER,
    following_id: B,
  });
  await result.getByRole('button', { name: 'İsteği iptal et', exact: true }).click();
  await expect(result.getByRole('button', { name: 'Takip et', exact: true })).toBeVisible();
  await page.getByLabel('Kullanıcı adıyla bul', { exact: true }).fill('ece');
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  await result.getByRole('button', { name: 'Takip et', exact: true }).click();
  await expect(page.locator('.people-list kx-follow-person')).toHaveCount(1);
  await result.getByRole('button', { name: 'Takipten çık', exact: true }).click();
  await expect(page.locator('.people-list kx-follow-person')).toHaveCount(0);
});
test('realtime request removal and rejection update the list; failed acceptance preserves it and supports retry', async ({
  page,
}) => {
  const options = {
    connections: [relation(B, OWNER), relation(C, OWNER)],
    people: [person(B, 'deniz'), person(C, 'ece')],
    failFollowWrites: true,
  };
  const state = await openSocial(page, 'tr', 'dark', '/profile/requests', 390, options);
  const rows = page.locator('.people-list kx-follow-person');
  await expect(rows).toHaveCount(2);
  await rows.first().getByRole('button', { name: 'Kabul et', exact: true }).click();
  await expect(page.locator('[role=alert]')).toContainText('Takip işlemi tamamlanamadı');
  await expect(rows).toHaveCount(2);
  options.failFollowWrites = false;
  await rows.first().getByRole('button', { name: 'Reddet', exact: true }).click();
  await expect(rows).toHaveCount(1);
  state.follows = [];
  state.broadcastFollows();
  await expect(rows).toHaveCount(0);
});
test('pending migration leaves follow actions disabled and sends no relationship writes', async ({
  page,
}) => {
  const state = await openSocial(page, 'tr', 'light', '/profile/requests', 390, {
    followSetupMissing: true,
    connections: [relation(B, OWNER)],
    people: [person(B, 'deniz')],
  });
  await expect(page.getByRole('button', { name: 'Kabul et', exact: true })).toBeDisabled();
  await expect(
    page.locator('[role=status]').filter({ hasText: 'Takip işlemlerine şu anda ulaşılamıyor.' }),
  ).toBeVisible();
  expect(
    state.requests.filter((r) => r.table === 'follows' && ['POST', 'PATCH', 'DELETE'].includes(r.method)),
  ).toHaveLength(0);
  await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
});
test('lookup no-results, denied read recovery and exact-match query stay safe', async ({ page }) => {
  const options = { connections: [], people: [], failFollows: true };
  const state = await openSocial(page, 'tr', 'light', '/profile/followers', 390, options);
  await expect(page.locator('[role=alert]')).toBeVisible();
  options.failFollows = false;
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).last().click();
  await expect(page.locator('[role=alert]')).toHaveCount(0);
  await page.getByLabel('Kullanıcı adıyla bul', { exact: true }).fill('olmayan_kullanici');
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  await expect(
    page.getByText('Bu kullanıcı adına ait erişilebilir bir profil bulunamadı.', { exact: true }),
  ).toBeVisible();
  expect(state.requests.some((r) => r.table === 'user_follows')).toBe(false);
});

test('changing a username cancels the slow old lookup and keeps only the new result', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/profile/following', 390, {
    connections: [],
    people: [person(B, 'deniz'), person(C, 'ece')],
  });
  let release, started;
  const held = new Promise((resolve) => {
    started = resolve;
  });
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/rest/v1/profiles?**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('username') !== 'eq.deniz') return route.fallback();
    started();
    await gate;
    await route
      .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ user_id: B }]) })
      .catch(() => {});
  });
  await page.getByLabel('Kullanıcı adıyla bul', { exact: true }).fill('deniz');
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  await held;
  await page.getByLabel('Kullanıcı adıyla bul', { exact: true }).fill('ece');
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Bulunan kullanıcı' })).toContainText('Ece Öğrenci');
  release();
  await expect(page.getByRole('region', { name: 'Bulunan kullanıcı' })).not.toContainText('Deniz Öğrenci');
});

test('list paging uses raw relationship offsets even when a profile is hidden', async ({ page }) => {
  const people = Array.from({ length: 35 }, (_, i) =>
    person('55555555-5555-4555-8555-' + String(i + 1).padStart(12, '0'), 'student' + i),
  );
  const state = await openSocial(page, 'tr', 'light', '/profile/following', 390, {
    connections: people.map((p) => relation(OWNER, p.user_id, 'accepted')),
    people: people.slice(1),
  });
  await expect(page.locator('.people-list kx-follow-person')).toHaveCount(29);
  await page.locator('.more button').click();
  await expect(page.locator('.people-list kx-follow-person')).toHaveCount(34);
  await expect(page.locator('.more')).toHaveCount(0);
  expect(
    state.requests.filter((r) => r.table === 'follows' && ['POST', 'PATCH', 'DELETE'].includes(r.method)),
  ).toHaveLength(0);
});
