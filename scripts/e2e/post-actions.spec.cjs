const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const OTHER = '22222222-2222-4222-8222-222222222222';
const card = (page, text) =>
  page.locator('kx-social-post-card').filter({ has: page.locator('.post-text', { hasText: text }) });
async function menu(page, text, item) {
  await card(page, text).locator('.menu-trigger').click();
  await page.getByRole('menuitem', { name: item, exact: true }).click();
}

test('own menu uses keyboard, pin limit, archive and restore without changing public chrome', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/profile');
  const trigger = card(page, 'Server post 1').locator('.menu-trigger');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Pin to profile', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  for (let i = 1; i <= 3; i++) {
    await menu(page, 'Server post ' + i, 'Pin to profile');
    await expect(card(page, 'Server post ' + i)).toContainText('Pinned to profile');
  }
  await menu(page, 'Server post 4', 'Pin to profile');
  await expect(page.getByRole('alert')).toContainText('up to 3');
  expect(state.posts.filter((p) => p.pin_slot)).toHaveLength(3);
  await menu(page, 'Server post 1', 'Archive');
  await expect(card(page, 'Server post 1')).toHaveCount(0);
  await page.goto('/settings/archive');
  await expect(card(page, 'Server post 1')).toBeVisible();
  await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
  await menu(page, 'Server post 1', 'Restore from archive');
  await expect(card(page, 'Server post 1')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your archive is empty' })).toBeVisible();
});

test('like and bookmark are optimistic, roll back on failure and persist after success', async ({ page }) => {
  const state = await openSocial(page, 'en', 'dark', '/dashboard');
  const post = card(page, 'Server post 1'),
    like = post.getByRole('button', { name: 'Like', exact: true });
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route('**/rpc/kampusx_set_reaction', async (route) => {
    await gate;
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42501', message: 'PRIVATE_ERROR_MARKER' }),
    });
  });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toBeDisabled();
  release();
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.entry-error')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('PRIVATE_ERROR_MARKER');
  await page.unroute('**/rpc/kampusx_set_reaction');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await post.getByRole('button', { name: 'Bookmark', exact: true }).click();
  await expect.poll(() => state.bookmarks.length).toBe(1);
  await page.goto('/settings/bookmarks');
  await expect(card(page, 'Server post 1')).toBeVisible();
  await card(page, 'Server post 1').getByRole('button', { name: 'Bookmark', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No bookmarked posts' })).toBeVisible();
});

test('deletion confirms and cleans Storage before final DB removal; failed cleanup is retryable', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/dashboard');
  const post = state.posts[0],
    path = `${post.user_id}/post/55555555-5555-4555-8555-555555555555.webp`;
  post.media_url = `https://auth.kampusx.test/storage/v1/object/public/uploads/${path}`;
  post.media_type = 'image';
  state.objects.set('uploads/' + path, {
    type: 'image/webp',
    bytes: Buffer.from('not decoded in this test'),
  });
  await page.reload();
  await menu(page, 'Server post 1', 'Delete');
  await expect(page.getByRole('dialog', { name: 'Delete post?' })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(state.posts.some((p) => p.id === post.id)).toBe(true);
  state.failCleanup = true;
  await menu(page, 'Server post 1', 'Delete');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.entry-error')).toContainText('Media cleanup failed');
  expect(state.posts.some((p) => p.id === post.id)).toBe(true);
  expect(state.objects.has('uploads/' + path)).toBe(true);
  await page.goto('/settings/archive');
  await expect(card(page, 'Server post 1')).toContainText('waiting to finish');
  state.failCleanup = false;
  await menu(page, 'Server post 1', 'Finish deletion');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(card(page, 'Server post 1')).toHaveCount(0);
  expect(state.objects.has('uploads/' + path)).toBe(false);
  const finish = state.requests.findLastIndex((r) => r.table === 'kampusx_finish_post_delete'),
    cleanup = state.requests.findLastIndex((r) => r.storage && r.method === 'DELETE');
  expect(cleanup).toBeGreaterThan(-1);
  expect(finish).toBeGreaterThan(cleanup);
});

test('other menu reports once, blocks feed/search and allows unblock from settings', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/dashboard');
  state.posts[0].user_id = OTHER;
  await page.reload();
  await menu(page, 'Server post 1', 'Report');
  await page.getByRole('radio', { name: 'Harassment', exact: true }).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Report', exact: true }).click();
  await expect.poll(() => state.reports.length).toBe(1);
  expect(state.reports[0].reason).toBe('harassment');
  await menu(page, 'Server post 1', 'Report');
  await page.getByRole('dialog').getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.locator('kx-toast')).toContainText('already reported');
  expect(state.reports.length).toBe(1);
  await menu(page, 'Server post 1', 'Block this person');
  await page.getByRole('dialog').getByRole('button', { name: 'Block this person', exact: true }).click();
  await expect(card(page, 'Server post 1')).toHaveCount(0);
  await page.goto('/search?q=Server%20post%201');
  await expect(page.getByRole('heading', { name: 'No matching posts' })).toBeVisible();
  await page.goto('/settings/blocked');
  await expect(page.locator('.person')).toHaveCount(1);
  await page.getByRole('button', { name: 'Unblock', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Unblock', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You have not blocked anyone' })).toBeVisible();
  expect(state.following).toBe(0);
});

test('thread sends a root and one reply, keeps failed drafts and confirms leaving', async ({ page }) => {
  const state = await openSocial(page, 'en', 'dark', '/dashboard');
  await card(page, 'Server post 1').getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(page).toHaveURL(/\/posts\//);
  await page.locator('#comment-content').fill('First comment');
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(page.locator('.comment')).toHaveCount(1);
  await page.locator('.comment').getByRole('button', { name: 'Reply', exact: true }).click();
  await page.locator('#comment-content').fill('One-level reply');
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('.comment.reply')).toHaveCount(1);
  await expect(page.locator('.comment.reply button')).toHaveCount(0);
  expect(state.comments[1].parent_id).toBe(state.comments[0].id);
  state.failActions = true;
  await page.locator('#comment-content').fill('Keep failed text');
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(page.locator('#comment-content')).toHaveValue('Keep failed text');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.locator('.sidebar-brand').click();
  await expect(page.getByRole('dialog', { name: 'Discard comment?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/posts\//);
});

for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`settings/search remain accessible at 320px ${language}/${theme}`, async ({ page }, info) => {
      await openSocial(page, language, theme, '/settings', 320);
      await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`settings-${language}-${theme}.png`), fullPage: true });
      await page.goto('/search?q=Server');
      await expect(page.locator('kx-social-post-card')).toHaveCount(6);
      await page
        .getByRole('button', { name: language === 'tr' ? 'Aramayı temizle' : 'Clear search', exact: true })
        .click();
      await expect(page.locator('#post-search')).toBeFocused();
      await expect(page.locator('kx-social-post-card')).toHaveCount(0);
    });

test('media renders the existing public URL directly without private downloads', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/dashboard'),
    post = state.posts[0];
  post.media_url = `https://auth.kampusx.test/storage/v1/object/public/uploads/${post.user_id}/post/55555555-5555-4555-8555-555555555555.webp`;
  post.media_type = 'image';
  await page.reload();
  const image = page.locator('img.post-media').first();
  await expect.poll(() => image.evaluate((img) => img.naturalWidth)).toBe(8);
  await expect(image).toHaveAttribute('src', post.media_url);
  expect(
    state.requests.filter((r) => r.storage && r.method === 'GET' && !r.url.includes('/object/public/')),
  ).toHaveLength(0);
  expect(state.requests.some((r) => r.storage && r.url.includes('/object/public/uploads/'))).toBe(true);
});
