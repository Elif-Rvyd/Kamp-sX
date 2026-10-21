const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const P = '44444444-4444-4444-8444-000000000001';
const copy = (language) =>
  language === 'tr'
    ? {
        send: 'Yorum yap',
        reply: 'Yanıtla',
        show: 'Yanıtları göster',
        more: 'Daha fazla göster',
        childMore: 'Daha fazla yanıt göster',
        refresh: 'Yanıtları yenile',
        clear: 'Taslağı temizle',
        discard: 'Vazgeç',
      }
    : {
        send: 'Comment',
        reply: 'Reply',
        show: 'Show replies',
        more: 'Load more',
        childMore: 'Show more replies',
        refresh: 'Refresh replies',
        clear: 'Clear draft',
        discard: 'Discard',
      };
const postWrites = (state) => state.requests.filter((r) => r.table === 'posts' && r.method === 'POST');
const runtimeErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('NG0103')) errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});
async function send(page, text) {
  await page.locator('#comment-content').fill(text);
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('#comment-content')).toHaveValue('');
}
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`replies persist as posts, nest once and remain accessible ${language}/${theme}`, async ({
      page,
    }, info) => {
      const state = await openSocial(page, language, theme, '/posts/' + P, 390);
      const t = copy(language);
      await send(page, '<b>Literal reply</b>');
      await expect(page.locator('.comment')).toHaveCount(1);
      await expect(page.locator('.comment b')).toHaveCount(0);
      await page.locator('.comment').getByRole('button', { name: t.reply, exact: true }).click();
      await send(page, 'Nested reply');
      await expect(page.locator('.comment.reply')).toHaveCount(1);
      await expect(page.locator('.comment.reply button')).toHaveCount(0);
      const root = state.posts.find((p) => p.id === P);
      expect(root.replies_count).toBe(1);
      const first = state.posts.find((p) => p.content === '<b>Literal reply</b>');
      expect(first.replies_count).toBe(1);
      expect(postWrites(state)).toHaveLength(2);
      for (const request of postWrites(state))
        expect(Object.keys(request.payload).sort()).toEqual([
          'content',
          'media_type',
          'media_url',
          'parent_id',
          'repost_of_id',
          'user_id',
        ]);
      await page.reload();
      await expect(page.locator('.comment')).toHaveCount(1);
      const show = page.getByRole('button', { name: t.show, exact: true });
      await show.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.comment.reply')).toContainText('Nested reply');
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(axe.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`replies-${language}-${theme}.png`), fullPage: true });
      const nested = state.posts.find((p) => p.content === 'Nested reply');
      await page.goto('/posts/' + nested.id);
      await expect(page.locator('#comment-content')).toHaveCount(0);
    });

test('reply setup gate refuses writes without the database guard', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/posts/' + P, 390, { replySetupMissing: true });
  await page.locator('#comment-content').fill('Keep this draft');
  await page.locator('form button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('database');
  await expect(page.locator('#comment-content')).toHaveValue('Keep this draft');
  expect(postWrites(state)).toHaveLength(0);
});

test('known rejection permits retry; uncertain receipt never repeats an INSERT', async ({ page }) => {
  const state = await openSocial(page, 'en', 'dark', '/posts/' + P);
  let requests = 0,
    status = 403;
  await page.route('**/rest/v1/posts**', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    requests++;
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42501', message: 'PRIVATE_ERROR_MARKER' }),
    });
  });
  await page.locator('#comment-content').fill('Preserved reply');
  const submit = page.locator('form button[type=submit]');
  await submit.click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(page.locator('#comment-content')).toHaveValue('Preserved reply');
  status = 503;
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('could not confirm');
  await expect(page.locator('body')).not.toContainText('PRIVATE_ERROR_MARKER');
  await page.getByRole('button', { name: 'Refresh replies', exact: true }).click();
  await expect(page.locator('#comment-content')).toHaveValue('Preserved reply');
  await expect(page.locator('form button[type=submit]')).toBeDisabled();
  expect(requests).toBe(2);
  await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#comment-content')).toHaveValue('Preserved reply');
  await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(page.locator('#comment-content')).toHaveValue('');
  await page.unroute('**/rest/v1/posts**');
  await send(page, 'A fresh decision');
  expect(postWrites(state)).toHaveLength(1);
});

test('root and nested pagination use raw offsets after a confirmed local reply', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/dashboard');
  const template = state.posts[0];
  const roots = Array.from({ length: 51 }, (_, i) => ({
    ...template,
    id: `55555555-5555-4555-8555-${String(i).padStart(12, '0')}`,
    content: `Root reply ${i}`,
    parent_id: P,
    created_at: new Date(Date.UTC(2026, 9, 20, 10, 0, i)).toISOString(),
    replies_count: i === 0 ? 51 : 0,
  }));
  const children = Array.from({ length: 51 }, (_, i) => ({
    ...template,
    id: `66666666-6666-4666-8666-${String(i).padStart(12, '0')}`,
    content: `Nested ${i}`,
    parent_id: roots[0].id,
    created_at: new Date(Date.UTC(2026, 9, 20, 11, 0, i)).toISOString(),
  }));
  state.posts.push(...roots, ...children);
  await page.goto('/posts/' + P);
  await expect(page.locator('.comment:not(.reply)')).toHaveCount(50);
  await page.getByRole('button', { name: 'Show replies', exact: true }).click();
  await expect(page.locator('.comment.reply')).toHaveCount(50);
  await send(page, 'Newest local reply');
  await page.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(page.locator('.comment:not(.reply)')).toHaveCount(52);
  await expect(page.locator('.comment:not(.reply)').filter({ hasText: 'Root reply 50' })).toBeVisible();
  await page.getByRole('button', { name: 'Show more replies', exact: true }).click();
  await expect(page.locator('.comment.reply')).toHaveCount(51);
  const rootPage = state.requests.find(
    (r) => r.table === 'posts' && r.filters.parent_id === 'eq.' + P && r.filters.offset === '50',
  );
  expect(rootPage).toBeTruthy();
});

test('empty/failed child reads retain the thread and retry without showing raw errors', async ({ page }) => {
  const state = await openSocial(page, 'en', 'light', '/posts/' + P);
  await expect(page.locator('.empty')).toContainText('No comments');
  await send(page, 'Root reply');
  const root = state.posts.find((p) => p.content === 'Root reply');
  root.replies_count = 1;
  await page.reload();
  await page.route('**/rest/v1/posts**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('parent_id') !== 'eq.' + root.id) return route.fallback();
    return route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: '42501', message: 'PRIVATE_CHILD' }),
    });
  });
  await page.getByRole('button', { name: 'Show replies', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('.comment')).toContainText('Root reply');
  await expect(page.locator('body')).not.toContainText('PRIVATE_CHILD');
  await page.unroute('**/rest/v1/posts**');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(postWrites(state)).toHaveLength(1);
});
