const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const peer = {
  user_id: B,
  username: 'deniz',
  full_name: 'Deniz Yıldız',
  bio: '',
  university: 'Uni',
  campus: 'North',
  studying: 'Computing',
  is_private: false,
  created_at: '2026-01-01T00:00:00Z',
  avatar_url: null,
  banner_url: null,
};
for (const [language, theme] of [
  ['tr', 'light'],
  ['en', 'dark'],
]) {
  test(`profile menu reports a user with no post and remains accessible ${language}/${theme}`, async ({
    page,
  }, info) => {
    const state = await openSocial(page, language, theme, '/people/' + B, 320, { people: [peer] });
    const trigger = page.getByRole('button', {
      name: language === 'tr' ? 'Profil seçenekleri' : 'Profile options',
      exact: true,
    });
    await expect(trigger).toBeVisible();
    const button = await trigger.boundingBox(),
      toolbar = await page.locator('.profile-toolbar').boundingBox();
    expect(button.x).toBeGreaterThan(toolbar.x + toolbar.width / 2);
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const report = page.getByRole('menuitem', {
      name: language === 'tr' ? 'Raporla' : 'Report',
      exact: true,
    });
    await expect(report).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.screenshot({ path: info.outputPath(`profile-menu-${language}-${theme}.png`), fullPage: true });
    await report.click();
    const dialog = page.getByRole('dialog', {
      name: language === 'tr' ? 'Kullanıcıyı şikâyet et' : 'Report user',
    });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(language === 'tr' ? 'Taciz' : 'Harassment', { exact: true }).check();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`profile-report-${language}-${theme}.png`),
      fullPage: true,
    });
    await dialog.getByRole('button', { name: language === 'tr' ? 'Raporla' : 'Report', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect.poll(() => state.reports.length).toBe(1);
    expect(state.reports[0]).toMatchObject({
      reporter_id: A,
      post_id: null,
      reported_user_id: B,
      reason: 'harassment',
    });
    expect(state.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(0);
    await expect(page).toHaveURL(new RegExp('/people/' + B));
  });
}
test('profile blocking requires confirmation, removes follows and hides the peer', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/people/' + B, 390, {
    people: [peer],
    connections: [
      { follower_id: A, following_id: B, status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
      { follower_id: B, following_id: A, status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ],
  });
  const trigger = page.getByRole('button', { name: 'Profile options', exact: true });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Block this person' }).click();
  const dialog = page.getByRole('dialog', { name: 'Block this person?' });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(state.blocks).toHaveLength(0);
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Block this person' }).click();
  await dialog.getByRole('button', { name: 'Block this person', exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  expect(state.blocks).toEqual([expect.objectContaining({ blocker_id: A, blocked_id: B })]);
  expect(state.follows).toHaveLength(0);
  await page.goto('/people/' + B);
  await expect(
    page.getByRole('heading', { name: 'This profile is unavailable.', exact: true }),
  ).toBeVisible();
});
test('failed profile moderation preserves the profile and can be retried', async ({ page }) => {
  const state = await openSocial(page, 'en', 'dark', '/people/' + B, 390, { people: [peer] });
  state.failActions = true;
  const trigger = page.getByRole('button', { name: 'Profile options', exact: true });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Report', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Report user' })
    .getByRole('button', { name: 'Report', exact: true })
    .click();
  await expect(page.locator('.profile-action [role=alert]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Deniz Yıldız', exact: true })).toBeVisible();
  expect(state.reports).toHaveLength(0);
  state.failActions = false;
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Report', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Report user' })
    .getByRole('button', { name: 'Report', exact: true })
    .click();
  await expect.poll(() => state.reports.length).toBe(1);
});
test('featured posts move to a separate profile section and unpin without duplicates', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/profile', 390);
  await expect(page.getByRole('button', { name: 'Profil seçenekleri', exact: true })).toHaveCount(0);
  const card = page.locator('kx-social-post-card').filter({ hasText: 'Server post 1' });
  await card.getByRole('button', { name: 'Gönderi seçenekleri', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Profilde öne çıkar', exact: true }).click();
  const featured = page.getByRole('region', { name: 'Öne çıkarılanlar', exact: true });
  await expect(featured.locator('kx-social-post-card')).toHaveCount(1);
  await expect(page.locator('kx-social-post-card')).toHaveCount(6);
  await page.reload();
  await expect(featured.locator('kx-social-post-card')).toHaveCount(1);
  await featured.getByRole('button', { name: 'Gönderi seçenekleri', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Öne çıkarmayı kaldır', exact: true }).click();
  await expect(featured).toHaveCount(0);
  await expect(page.locator('kx-social-post-card')).toHaveCount(6);
  await expect(page.locator('.profile-menu').getByText('Geçmiş', { exact: true })).toHaveCount(0);
});

test('a confirmation opened on one profile cannot report a subsequently opened profile', async ({ page }) => {
  const C = '33333333-3333-4333-8333-333333333333';
  const state = await openSocial(page, 'en', 'light', '/people/' + B, 390, {
    people: [peer, { ...peer, user_id: C, username: 'ece', full_name: 'Ece Öğrenci' }],
  });
  await page.getByRole('button', { name: 'Profile options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Report', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Report user' });
  await expect(dialog).toBeVisible();
  await page.evaluate((id) => {
    history.pushState({}, '', '/people/' + id);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, C);
  await expect(page.getByRole('heading', { name: 'Ece Öğrenci', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.reports).toHaveLength(0);
});
