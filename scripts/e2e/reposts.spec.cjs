const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const card = (page, text) =>
  page.locator('kx-social-post-card').filter({ has: page.locator('.post-text', { hasText: text }) });
async function choose(page, text, action) {
  await card(page, text).locator('kx-action-sheet .sheet-trigger').click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect
    .poll(async () => {
      const b = await page.getByRole('menu').boundingBox();
      return !!b && b.x >= 0 && b.x + b.width <= page.viewportSize().width;
    })
    .toBe(true);
  await page.getByRole('menuitem', { name: action, exact: true }).click();
}
for (const [language, theme, width] of [
  ['en', 'dark', 320],
  ['tr', 'light', 390],
])
  test(`repost undo/repost again and quote embed ${language}/${theme}`, async ({ page }) => {
    const state = await openSocial(page, language, theme, '/profile', width);
    const original = state.posts[0].id;
    await expect(card(page, 'Server post 1').locator('kx-action-sheet .sheet-trigger')).toBeEnabled();
    await choose(page, 'Server post 1', language === 'tr' ? 'Yeniden paylaş' : 'Repost');
    await expect
      .poll(
        () =>
          state.posts.filter((p) => p.repost_of_id === original && p.content === '' && !p.deleted_at).length,
      )
      .toBe(1);
    await expect(card(page, 'Server post 1').locator('kx-action-sheet .sheet-trigger')).toBeEnabled();
    await choose(page, 'Server post 1', language === 'tr' ? 'Repostu geri al' : 'Undo repost');
    await expect
      .poll(
        () =>
          state.posts.filter((p) => p.repost_of_id === original && p.content === '' && !p.deleted_at).length,
      )
      .toBe(0);
    await expect(card(page, 'Server post 1').locator('kx-action-sheet .sheet-trigger')).toBeEnabled();
    await choose(page, 'Server post 1', language === 'tr' ? 'Yeniden paylaş' : 'Repost');
    await expect
      .poll(
        () =>
          state.posts.filter((p) => p.repost_of_id === original && p.content === '' && !p.deleted_at).length,
      )
      .toBe(1);
    await expect(card(page, 'Server post 1').locator('kx-action-sheet .sheet-trigger')).toBeEnabled();
    await choose(page, 'Server post 1', language === 'tr' ? 'Alıntıla' : 'Quote');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const publish = dialog.getByRole('button', {
      name: language === 'tr' ? 'Alıntıyı paylaş' : 'Publish quote',
      exact: true,
    });
    await expect(publish).toBeDisabled();
    await dialog.locator('textarea').fill('My real quote');
    await publish.click();
    await expect(card(page, 'My real quote').locator('kx-embedded-post')).toContainText('Server post 1');
    const quote = state.posts.find((p) => p.content === 'My real quote');
    expect(quote.repost_of_id).toBe(original);
    expect(quote.parent_id).toBe(null);
    await card(page, 'My real quote').locator('.menu-trigger').click();
    await expect(
      page.getByRole('menuitem', {
        name: language === 'tr' ? 'Profilde öne çıkar' : 'Pin to profile',
        exact: true,
      }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    state.posts.find((p) => p.id === original).deleted_at = new Date().toISOString();
    await page.reload();
    await expect(card(page, 'My real quote').locator('kx-embedded-post')).toContainText(
      language === 'tr'
        ? 'Orijinal gönderi şu anda görüntülenemiyor'
        : 'The original post is currently unavailable',
    );
    const inserts = state.requests.filter((r) => r.table === 'posts' && r.method === 'POST');
    expect(
      inserts.every((r) =>
        Object.keys(r.payload).every((k) =>
          ['user_id', 'content', 'media_url', 'media_type', 'parent_id', 'repost_of_id'].includes(k),
        ),
      ),
    ).toBe(true);
  });
