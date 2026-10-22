const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const B = '22222222-2222-4222-8222-222222222222';
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`account radio levels persist with keyboard and stay accessible ${language}/${theme}`, async ({
      page,
    }, info) => {
      const state = await openSocial(page, language, theme, '/settings/account-status', 320);
      const department = page.getByRole('radio', {
        name: language === 'tr' ? /^Bölüm/ : /^Department/,
      });
      await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
      await expect(page.getByRole('radio')).toHaveCount(5);
      await expect(department).not.toBeChecked();
      await department.focus();
      await page.keyboard.press('Space');
      await expect(department).toBeChecked();
      await page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }).click();
      await expect.poll(() => state.profile.visible_department).toBe(true);
      await expect(page.locator('kx-toast')).toBeVisible();
      await page.reload();
      await expect(department).toBeChecked();
      const writes = state.requests.filter((r) => r.table === 'profiles' && r.method === 'PATCH');
      expect(writes).toHaveLength(1);
      expect(Object.keys(writes[0].payload).sort()).toEqual([
        'visible_campus',
        'visible_department',
        'visible_explore',
        'visible_university',
      ]);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`account-${language}-${theme}.png`), fullPage: true });
    });
test('unsaved audience changes are guarded; failed saves require a fresh read without resending', async ({
  page,
}) => {
  const options = { failAccountSave: true };
  const state = await openSocial(page, 'en', 'dark', '/settings/account-status', 390, options);
  const department = page.getByRole('radio', { name: /^Department/ });
  await department.click();
  await page.locator('.sidebar-brand').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(department).toBeChecked();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be confirmed');
  await expect(department).toBeChecked();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(department).not.toBeChecked();
  expect(state.requests.filter((r) => r.table === 'profiles' && r.method === 'PATCH')).toHaveLength(1);
});
test('missing account migration fails closed without pretending that preferences were saved', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/settings/account-status', 390, {
    accountSetupMissing: true,
  });
  await expect(page.getByRole('alert')).toContainText('not enabled');
  await expect(page.getByRole('radio')).toHaveCount(0);
  expect(state.requests.some((r) => r.table === 'profiles' && r.method === 'PATCH')).toBe(false);
});
test('search identities and post text open the real profile and thread; date is below content', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/search', 390, {
    people: [
      {
        user_id: B,
        username: 'deniz',
        full_name: 'Deniz Yıldız',
        bio: 'Bio',
        campus: 'North',
        university: 'Uni',
        studying: 'Computing',
        is_private: false,
        created_at: '2026-01-01T00:00:00Z',
        avatar_url: null,
        banner_url: null,
      },
    ],
    connections: [],
  });
  state.posts[0].user_id = B;
  state.posts[0].content = 'Deniz campus post';
  await page.getByLabel('Search people or posts', { exact: true }).fill('deniz');
  await page.locator('kx-follow-person a.identity').click();
  await expect(page).toHaveURL(new RegExp('/people/' + B));
  await expect(page.getByRole('heading', { name: 'Deniz Yıldız', exact: true })).toBeVisible();
  await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
  ).toEqual([]);
  await expect(page.getByRole('button', { name: 'Edit Profile', exact: true })).toHaveCount(0);
  const post = page.locator('kx-social-post-card').filter({ hasText: 'Deniz campus post' });
  await expect(post.locator('.post-header time')).toHaveCount(0);
  await expect(post.locator('.post-date time')).toBeVisible();
  expect(
    await post.evaluate(
      (el) =>
        !!(
          el.querySelector('.post-text').compareDocumentPosition(el.querySelector('.post-date')) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
  await post.locator('.post-text').click();
  await expect(page).toHaveURL(new RegExp('/posts/' + state.posts[0].id));
  await expect(page.locator('#comment-content')).toBeVisible();
});
test('university, campus and department tabs load filtered real rows', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/dashboard');
  const tabs = page.getByRole('tab');
  await tabs.nth(2).click();
  await expect
    .poll(() => state.requests.some((r) => r.table === 'posts' && r.filters?.['profiles.campus_id']))
    .toBe(true);
  await expect(page.locator('kx-feed-skeleton')).toHaveCount(0);
  await expect(page.locator('[role=tabpanel]:not([inert]) kx-social-post-card')).toHaveCount(6);
  await tabs.nth(3).click();
  await expect
    .poll(() => state.requests.some((r) => r.table === 'posts' && r.filters?.['profiles.department_id']))
    .toBe(true);
});

test('missing IDs disable only department/campus and choosing Followers writes all false', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'dark', '/settings/account-status', 390, {
    profile: { campus_id: null, department_id: null, visible_explore: true, audience_configured: true },
  });
  await expect(page.getByRole('radio', { name: /^Department/ })).toBeDisabled();
  await expect(page.getByRole('radio', { name: /^Campus/ })).toBeDisabled();
  await page.getByRole('radio', { name: /^Followers/ }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => state.profile.visible_explore).toBe(false);
  expect(
    ['department', 'campus', 'university', 'explore'].every((k) => state.profile['visible_' + k] === false),
  ).toBe(true);
});
test('profile text persists in profiles across reload without modifying Auth metadata', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/profile');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.locator('#profile-name').fill('Canonical Student');
  await page.locator('#profile-bio').fill('Persisted biography');
  for (const key of ['university', 'campus', 'department', 'username'])
    await expect(page.locator('#profile-' + key)).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Canonical Student', exact: true })).toBeVisible();
  await expect(page.locator('.profile-bio')).toHaveText('Persisted biography');
  expect(state.authRequests).toHaveLength(0);
  const write = state.requests.find(
    (r) => r.table === 'profiles' && r.method === 'PATCH' && r.payload.full_name,
  );
  expect(write.payload).toEqual({ full_name: 'Canonical Student', bio: 'Persisted biography' });
});
