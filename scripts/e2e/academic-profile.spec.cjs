const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`registered academic identity is readonly while profile text saves ${language}/${theme}`, async ({
      page,
    }) => {
      const state = await openSocial(page, language, theme, '/profile/edit', 1440);
      for (const id of ['profile-university', 'profile-campus', 'profile-department'])
        await expect(page.locator('#' + id)).toHaveAttribute('readonly', '');
      await page.locator('#profile-name').fill('New display name');
      await page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }).click();
      await expect(page).toHaveURL(/\/profile$/);
      expect(state.authRequests).toHaveLength(1);
      expect(Object.keys(state.authRequests[0].data).sort()).toEqual(['bio', 'full_name']);
      await expect(page.locator('kx-profile-header')).toContainText('Kırşehir Ahi Evran Üniversitesi');
      await page.reload();
      await expect(page.locator('kx-profile-header')).toContainText('Bilgisayar Programcılığı');
    });
test('text save errors keep edits without sending academic changes or a success toast', async ({ page }) => {
  const state = await openSocial(page, 'tr', 'light', '/profile/edit', 390, { failAcademic: true });
  await page.locator('#profile-name').fill('Yeni İsim');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.locator('.save-error')).toContainText('Profil bilgilerin kaydedilemedi');
  await expect(page.locator('#profile-name')).toHaveValue('Yeni İsim');
  await expect(page.locator('kx-toast')).toHaveCount(0);
  expect(state.authRequests).toHaveLength(1);
  expect(Object.keys(state.authRequests[0].data).sort()).toEqual(['bio', 'full_name']);
});
