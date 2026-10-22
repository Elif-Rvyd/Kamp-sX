const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const { A, B, CONV } = require('./mock-messaging.cjs');
const peer = {
  user_id: B,
  username: 'deniz',
  full_name: 'Deniz Yıldız',
  bio: '',
  university: 'Uni',
  campus: 'North',
  studying: 'Computing',
  created_at: '2026-01-01T00:00:00Z',
  avatar_url: null,
  banner_url: null,
};
for (const [language, theme, width] of [
  ['tr', 'light', 390],
  ['en', 'dark', 1280],
]) {
  test(`inbox and conversation preserve theme, labels and keyboard access ${language}/${theme}`, async ({
    page,
  }, info) => {
    const { messaging: state } = await openSocial(page, language, theme, '/messages', width, {
      messaging: {},
    });
    await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#social-content');
    const row = page.locator('kx-inbox-item a');
    await expect(row).toContainText('Deniz Yıldız');
    await expect(row).toContainText('Merhaba Elif');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp('/messages/' + CONV));
    await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
    await expect(page.locator('kx-message-bubble')).toHaveCount(1);
    await expect.poll(() => state.reads).toBeGreaterThan(0);
    const input = page.getByLabel(language === 'tr' ? 'Mesajını yaz' : 'Write your message', { exact: true });
    await input.fill('KampüsX mesaj testi');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('kx-message-bubble')).toHaveCount(2);
    await expect(input).toHaveValue('');
    expect(state.sends).toEqual([{ conversation_id: CONV, content: 'KampüsX mesaj testi' }]);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`conversation-${language}-${theme}.png`), fullPage: true });
  });
}
test('profile capability check never creates a conversation; explicit click uses the start RPC', async ({
  page,
}) => {
  const { messaging: state } = await openSocial(page, 'en', 'light', '/people/' + B, 390, {
    people: [peer],
    messaging: {},
  });
  const start = page.getByRole('button', { name: 'Message', exact: true });
  await expect(start).toBeEnabled();
  expect(state.starts).toBe(0);
  await start.click();
  await expect(page).toHaveURL(new RegExp('/messages/' + CONV));
  expect(state.starts).toBe(1);
});
test('profile eligibility rejection disables the button without using client follow counts', async ({
  page,
}) => {
  const { messaging: state } = await openSocial(page, 'tr', 'light', '/people/' + B, 390, {
    people: [peer],
    connections: [{ follower_id: A, following_id: B, status: 'accepted' }],
    messaging: { canSend: false },
  });
  await expect(page.getByRole('button', { name: 'Mesaj', exact: true })).toBeDisabled();
  expect(state.starts).toBe(0);
});
test('message deletion requires confirmation, patches deleted_at only and shows a tombstone', async ({
  page,
}) => {
  const { messaging: state } = await openSocial(page, 'en', 'light', '/messages/' + CONV, 390, {
    messaging: {},
  });
  await page.getByLabel('Write your message', { exact: true }).fill('Delete me');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const own = page.locator('kx-message-bubble').filter({ hasText: 'Delete me' });
  await own.getByRole('button', { name: 'Message actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete this message?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(state.messages.at(-1).deleted_at).toBeNull();
  await own.getByRole('button', { name: 'Message actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete message', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete message', exact: true }).click();
  await expect(page.locator('kx-message-bubble').filter({ hasText: 'This message was deleted' })).toHaveCount(
    1,
  );
  expect(Object.keys(state.requests.find((r) => r.method === 'PATCH').body)).toEqual(['deleted_at']);
});
test('incoming INSERT/UPDATE events refetch, failed sends disable composer and blocked history disappears', async ({
  page,
}) => {
  const { messaging: state } = await openSocial(page, 'en', 'dark', '/messages/' + CONV, 390, {
    messaging: {},
  });
  await expect.poll(() => state.joins.filter((t) => t.includes('dm:')).length).toBe(1);
  state.messages.push({
    ...state.messages[0],
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    content: 'Live incoming',
    created_at: '2026-10-22T11:02:00+00:00',
  });
  state.emit();
  await expect(page.locator('kx-message-bubble').filter({ hasText: 'Live incoming' })).toBeVisible();
  state.messages.at(-1).deleted_at = new Date().toISOString();
  state.messages.at(-1).content = '';
  state.emit('UPDATE');
  await expect(
    page.locator('kx-message-bubble').filter({ hasText: 'This message was deleted' }),
  ).toBeVisible();
  state.canSend = false;
  await page.getByLabel('Write your message', { exact: true }).fill('Rejected');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Write your message', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Write your message', { exact: true })).toHaveValue('Rejected');
  state.hidden = true;
  state.emit('UPDATE');
  await expect(page.getByRole('heading', { name: 'This conversation is unavailable' })).toBeVisible();
  await expect(page.locator('kx-message-bubble')).toHaveCount(0);
});
test('uncertain receipt never resends automatically and leaving a draft is guarded', async ({ page }) => {
  const { messaging: state } = await openSocial(page, 'en', 'light', '/messages/' + CONV, 390, {
    messaging: { uncertain: true },
  });
  await page.getByLabel('Write your message', { exact: true }).fill('One message only');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(
    page.locator('[role=alert]').filter({ hasText: 'Delivery could not be confirmed.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  expect(state.sends).toHaveLength(1);
  await page.locator('kx-social-page-frame header a').click();
  const dialog = page.getByRole('dialog', { name: 'Discard draft?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/messages/' + CONV));
  await page.getByRole('button', { name: 'I checked the conversation, start a new draft' }).click();
  await dialog.getByRole('button', { name: 'Discard draft', exact: true }).click();
  await expect(page.getByLabel('Write your message', { exact: true })).toHaveValue('');
  await page.locator('kx-social-page-frame header a').click();
  await expect(page).toHaveURL(/\/messages$/);
  await page.locator('kx-social-page-frame header a').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect.poll(() => state.leaves.filter((t) => t.includes('dm:')).length).toBe(1);
});

test('empty inbox and a failed read offer honest feedback and retry', async ({ page }) => {
  const { messaging: state } = await openSocial(page, 'en', 'light', '/messages', 390, {
    messaging: { empty: true },
  });
  await expect(page.getByRole('heading', { name: 'Your inbox is ready' })).toBeVisible();
  state.failInbox = true;
  state.emit();
  await expect(page.locator('[role=alert]')).toContainText('Messages could not be updated');
  state.failInbox = false;
  state.empty = false;
  await page.locator('[role=alert]').getByRole('button').click();
  await expect(page.locator('kx-inbox-item')).toHaveCount(1);
});

test('older history uses a cursor without duplicates and preserves the reading position', async ({
  page,
}) => {
  const messages = Array.from({ length: 55 }, (_, i) => ({
    id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i + 1).padStart(12, '0')}`,
    conversation_id: CONV,
    sender_id: B,
    content: 'Earlier message ' + (i + 1),
    created_at: new Date(Date.UTC(2026, 9, 22, 10, i)).toISOString(),
    deleted_at: null,
  }));
  const { messaging: state } = await openSocial(page, 'en', 'dark', '/messages/' + CONV, 390, {
    messaging: { messages },
  });
  await expect(page.locator('kx-message-bubble')).toHaveCount(50);
  const history = page.getByRole('log');
  await history.evaluate((e) => (e.scrollTop = 0));
  await page.getByRole('button', { name: 'Load earlier messages', exact: true }).click();
  await expect(page.locator('kx-message-bubble')).toHaveCount(55);
  await expect(page.getByRole('button', { name: 'Load earlier messages', exact: true })).toHaveCount(0);
  expect(state.requests.some((r) => r.query.or?.includes('id.lt.'))).toBe(true);
  expect(await history.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
});

test('reconnected channel refetches messages missed while disconnected', async ({ page }) => {
  const { messaging: state } = await openSocial(page, 'en', 'light', '/messages/' + CONV, 390, {
    messaging: {},
  });
  await expect.poll(() => state.joins.filter((t) => t.includes('dm:')).length).toBe(1);
  state.disconnect();
  state.messages.push({
    ...state.messages[0],
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    content: 'While offline',
    created_at: '2026-10-22T12:03:00+00:00',
  });
  await expect(page.locator('kx-message-bubble').filter({ hasText: 'While offline' })).toBeVisible({
    timeout: 15000,
  });
  await expect.poll(() => state.joins.filter((t) => t.includes('dm:')).length).toBeGreaterThan(1);
});
