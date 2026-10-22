const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const { B, CONV } = require('./mock-messaging.cjs');
const card = (page) =>
  page
    .locator('kx-social-post-card')
    .filter({ has: page.locator('.post-text', { hasText: 'Server post 1' }) });
for (const [lang, theme, width] of [
  ['tr', 'light', 390],
  ['en', 'dark', 320],
]) {
  test(`share a post in a real conversation flow and respect deleted source ${lang}/${theme}`, async ({
    page,
  }) => {
    const social = await openSocial(page, lang, theme, '/profile', width, { messaging: {} });
    const postId = social.posts[0].id;
    await card(page)
      .getByRole('button', { name: lang === 'tr' ? 'Paylaş' : 'Share', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Deniz Yıldız');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    await dialog.getByRole('button', { name: /Deniz Yıldız/ }).click();
    await expect(dialog).not.toBeVisible();
    expect(social.messaging.sends).toEqual([{ conv: CONV, target: postId }]);
    await page.goto('/messages/' + CONV);
    await expect(page.locator('kx-shared-message-post')).toContainText('Server post 1');
    await page.locator('kx-shared-message-post a').click();
    await expect(page).toHaveURL(new RegExp('/posts/' + postId));
    social.posts[0].deleted_at = new Date().toISOString();
    await page.goto('/messages/' + CONV);
    await expect(page.locator('kx-shared-message-post')).not.toContainText('Server post 1');
    await expect(page.locator('kx-shared-message-post')).toContainText(
      lang === 'tr' ? 'görüntülenemiyor' : 'unavailable',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: test.info().outputPath('shared-post-' + lang + '-' + theme + '.png'),
      fullPage: true,
    });
  });
  test(`visible unique account view, repeat navigation and explanation ${lang}/${theme}`, async ({
    page,
  }) => {
    const social = await openSocial(page, lang, theme, '/profile', width);
    social.posts[0].user_id = B;
    social.people.push({ ...social.profile, user_id: B, username: 'deniz', full_name: 'Deniz' });
    await page.goto('/posts/' + social.posts[0].id);
    const views = card(page).getByRole('button', {
      name: lang === 'tr' ? 'Görüntülenme' : 'Views',
      exact: true,
    });
    await views.scrollIntoViewIfNeeded();
    await expect(views).toContainText('1', { timeout: 10000 });
    expect(social.viewSeen.has(social.posts[0].id)).toBe(true);
    await views.click();
    await expect(page.getByRole('dialog')).toContainText(
      lang === 'tr' ? 'Aynı hesap tekrar sayılmaz' : 'Repeat views',
    );
    await page.keyboard.press('Escape');
    await expect(views).toBeFocused();
    await page.goto('/dashboard');
    await page.goto('/posts/' + social.posts[0].id);
    await expect(
      card(page).getByRole('button', { name: lang === 'tr' ? 'Görüntülenme' : 'Views', exact: true }),
    ).toContainText('1');
    expect(social.views.get(social.posts[0].id)).toBe(1);
  });
}
test('uncertain post sharing cannot be resent; inbox is the recovery path', async ({ page }) => {
  const social = await openSocial(page, 'en', 'light', '/profile', 390, { messaging: { uncertain: true } });
  await card(page).getByRole('button', { name: 'Share', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Deniz Yıldız/ }).click();
  await expect(dialog.getByRole('alert')).toContainText('could not be confirmed');
  await expect(dialog.getByRole('button', { name: /Deniz Yıldız/ })).toBeDisabled();
  expect(social.messaging.sends).toHaveLength(1);
  await dialog.getByRole('link', { name: 'Open the conversation to check delivery' }).click();
  await expect(page).toHaveURL(new RegExp('/messages/' + CONV));
});
test('missing view service shows unknown rather than fabricated zero and can retry', async ({ page }) => {
  const social = await openSocial(page, 'en', 'light', '/profile', 390);
  social.failViews = true;
  await page.reload();
  const views = card(page).getByRole('button', { name: 'Views', exact: true });
  await expect(views).toContainText('—');
  await views.click();
  await expect(page.getByRole('dialog')).toContainText('View count is unavailable');
  await page.keyboard.press('Escape');
  social.failViews = false;
  await views.click();
  await expect(views).toContainText('0');
});
