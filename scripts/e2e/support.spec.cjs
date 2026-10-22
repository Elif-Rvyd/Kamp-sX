const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
async function backend(page, options = {}) {
  const state = {
    sends: [],
    checks: 0,
    ready: true,
    rate: false,
    pending: false,
    status: 'pending',
    pause: false,
    finish: null,
    ...options,
  };
  await page.route('**/functions/v1/support-email**', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (request.method() === 'GET') {
      if (url.searchParams.has('request_id')) {
        state.checks++;
        return route.fulfill({
          status: 200,
          json: { status: state.status, request_id: url.searchParams.get('request_id') },
        });
      }
      return route.fulfill({
        status: 200,
        json: { identity: { email: 'elif@university.edu.tr', username: 'elif' }, ready: state.ready },
      });
    }
    state.sends.push(request.postDataJSON());
    if (state.pause)
      await new Promise((resolve) => {
        state.finish = resolve;
      });
    if (state.rate) return route.fulfill({ status: 429, json: { code: 'rate_limited' } });
    return route.fulfill({
      status: state.pending ? 202 : 200,
      json: { status: state.pending ? 'pending' : 'sent', request_id: state.sends.at(-1).request_id },
    });
  });
  return state;
}
for (const [lang, theme, width] of [
  ['tr', 'light', 390],
  ['en', 'dark', 320],
]) {
  test(`help link opens verified readonly identity and sends once ${lang}/${theme}`, async ({
    page,
  }, info) => {
    const state = await backend(page);
    await openSocial(page, lang, theme, '/dashboard', width);
    await page
      .locator('.profile-menu')
      .getByRole('link', { name: lang === 'tr' ? 'Yardım Merkezi' : 'Help Center', exact: true })
      .click();
    await expect(page).toHaveURL(/\/help$/);
    await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
    const email = page.locator('#support-email'),
      username = page.locator('#support-username'),
      description = page.locator('#support-description');
    await expect(email).toHaveValue('elif@university.edu.tr');
    await expect(username).toHaveValue('@elif');
    await expect(email).toHaveAttribute('readonly', '');
    await expect(username).toHaveAttribute('readonly', '');
    const privacy = page.getByRole('button', {
      name: lang === 'tr' ? 'Başvuru bilgilerinin kullanımı' : 'How support request data is used',
      exact: true,
    });
    await privacy.click();
    await expect(page.getByRole('dialog')).toContainText('Resend');
    await expect(page.getByRole('dialog')).toContainText('Google/Gmail');
    await page.keyboard.press('Escape');
    await expect(privacy).toBeFocused();
    const send = page.getByRole('button', {
      name: lang === 'tr' ? 'Destek başvurusu gönder' : 'Send support request',
      exact: true,
    });
    await send.click();
    await expect(description).toBeFocused();
    await expect(description).toHaveAttribute('aria-invalid', 'true');
    expect(state.sends).toHaveLength(0);
    await description.fill('Gönderimi açarken bir sorunla karşılaşıyorum.');
    state.pause = true;
    await send.click();
    await expect(send).toBeDisabled();
    await expect(description).toHaveAttribute('readonly', '');
    await expect.poll(() => state.sends.length).toBe(1);
    state.finish();
    await expect(
      page.getByRole('status').filter({ hasText: lang === 'tr' ? 'e-posta servisine' : 'email service' }),
    ).toBeVisible();
    await expect(description).toHaveValue('');
    expect(Object.keys(state.sends[0]).sort()).toEqual(['description', 'request_id']);
    expect(state.sends).toHaveLength(1);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`support-${lang}-${theme}.png`), fullPage: true });
  });
}
test('support rate limits preserve the draft and never claim delivery', async ({ page }) => {
  const state = await backend(page, { rate: true });
  await openSocial(page, 'en', 'light', '/help');
  await page.locator('#support-description').fill('The post does not open.');
  await page.getByRole('button', { name: 'Send support request', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Too many');
  await expect(page.locator('#support-description')).toHaveValue('The post does not open.');
  await expect(page.locator('.receipt')).toHaveCount(0);
  expect(state.sends).toHaveLength(1);
});
test('uncertain support delivery checks status without sending and retries only the same immutable request', async ({
  page,
}) => {
  const state = await backend(page, { pending: true });
  await openSocial(page, 'en', 'dark', '/help', 320);
  const description = page.locator('#support-description');
  await description.fill('The conversation does not open.');
  await page.getByRole('button', { name: 'Send support request', exact: true }).click();
  const check = page.getByRole('button', { name: 'Check delivery status', exact: true });
  await expect(check).toBeVisible();
  await expect(description).toHaveAttribute('readonly', '');
  await check.click();
  expect(state.sends).toHaveLength(1);
  expect(state.checks).toBe(1);
  state.status = 'retryable';
  await check.click();
  await expect(page.getByRole('button', { name: 'Send support request', exact: true })).toBeVisible();
  await expect(description).toHaveAttribute('readonly', '');
  state.pending = false;
  await page.getByRole('button', { name: 'Send support request', exact: true }).click();
  await expect(page.locator('.receipt')).toBeVisible();
  expect(state.sends).toHaveLength(2);
  expect(state.sends[0]).toEqual(state.sends[1]);
});
test('missing support setup disables sending, retry restores readiness and dirty navigation confirms', async ({
  page,
}) => {
  const state = await backend(page, { ready: false });
  await openSocial(page, 'tr', 'dark', '/help');
  const send = page.getByRole('button', { name: 'Destek başvurusu gönder', exact: true });
  await expect(send).toBeDisabled();
  await page.locator('#support-description').fill('Form açıklamam korunmalı.');
  state.ready = true;
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await expect(send).toBeEnabled();
  await expect(page.locator('#support-description')).toHaveValue('Form açıklamam korunmalı.');
  await page.locator('.profile-menu').getByRole('link', { name: 'Profil', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/help$/);
  expect(state.sends).toHaveLength(0);
});
test('logout during support delivery clears old identity and ignores the late receipt', async ({ page }) => {
  const state = await backend(page, { pause: true });
  await openSocial(page, 'en', 'light', '/help');
  await page.locator('#support-description').fill('A session-bound support request.');
  await page.getByRole('button', { name: 'Send support request', exact: true }).click();
  await expect.poll(() => state.sends.length).toBe(1);
  await page.locator('.logout-button').click();
  await expect(page).toHaveURL(/\/auth\/login/);
  state.finish();
  await expect(page.locator('.receipt')).toHaveCount(0);
  await expect(page.locator('#support-email')).toHaveCount(0);
});
