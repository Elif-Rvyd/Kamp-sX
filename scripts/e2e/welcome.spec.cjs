const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test.beforeEach(async ({ page }) => {
  // All auth traffic is fulfilled locally; UI tests never contact a real project.
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const operation = new URL(request.url()).pathname.split('/auth/v1/')[1];
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'student@itu.edu.tr',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { username: 'student' },
      identities: [],
    };
    if (operation === 'token') {
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const body = {
        access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: expiresAt })}.local_test_signature`,
        refresh_token: 'local_test_refresh_token',
        expires_in: 3600,
        expires_at: expiresAt,
        token_type: 'bearer',
        user,
      };
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    } else if (operation === 'signup') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ...user, email_confirmed_at: null }),
      });
    } else if (operation === 'recover') {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: '{}' });
    } else if (operation === 'user') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(user) });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'unexpected_failure', msg: 'Unexpected mocked operation' }),
      });
    }
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('kampusx-language')) localStorage.setItem('kampusx-language', 'tr');
    if (!localStorage.getItem('kampusx-theme')) localStorage.setItem('kampusx-theme', 'light');
  });
  await page.goto('/');
});
test('login validation, password reveal, and mocked authentication result', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toBeFocused();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('@deniz');
  await page.locator('#login-password').fill('test-password');
  await panel.getByRole('button', { name: 'Şifreyi göster' }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(panel.locator('button[type=submit]')).toBeDisabled();
  await expect(panel.locator('.success-message')).toContainText(/giriş/i);
});
test('register validates university address and consent; Google stays local', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Kayıt ol', exact: true }).click();
  await panel.getByRole('button', { name: 'Google öğrenci hesabıyla başla' }).click();
  await expect(panel.locator('.info-message')).toContainText(/Google/);
  await page.locator('#register-email').fill('student@gmail.com');
  await page.locator('#register-username').fill('@deniz');
  await page.locator('#register-password').fill('LongPassword123!');
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(page.locator('#register-email')).toBeFocused();
  await expect(panel.getByText('.edu.tr uzantılı üniversite e-postanı kullan.')).toBeVisible();
  await page.locator('#register-email').fill('student@itu.edu.tr');
  await page.locator('#register-consent').check();
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(panel.locator('.success-message')).toContainText(/e-posta/i);
});
test('password reset has validation, loading, success and return', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Şifremi unuttum' }).click();
  await page.locator('#reset-email').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();
  await expect(panel.locator('button[type=submit]')).toBeDisabled();
  await expect(panel.locator('.reset-success')).toContainText(/hesap|kayıtlı/i);
  await expect(panel.locator('.reset-success')).toBeFocused();
  await panel.getByRole('button', { name: 'Girişe dön' }).click();
  await expect(page.locator('#login-identity')).toBeVisible();
});
test('feed keyboard tabs, community CTA and legal modal', async ({ page }) => {
  const university = page.getByRole('tab', { name: 'Üniversitem' });
  await university.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Bölümüm' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Bitirme projesi');
  await page.getByRole('button', { name: 'Katıl: Yazılım Kulübü' }).click();
  await expect(page.locator('#register-email')).toBeVisible();
  await expect(page.locator('#auth-title')).toBeFocused();
  await page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true })).toBeFocused();
});
test('instant language/theme change and persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'English', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
  await page.getByRole('button', { name: 'Switch to dark theme' }).first().click();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-language'))).toBe('en');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-theme'))).toBe('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
});
test('all auth routes lazy load and unknown routes recover', async ({ page }) => {
  for (const [url, field] of [
    ['/auth/login', '#login-identity'],
    ['/auth/register', '#register-email'],
    ['/auth/forgot-password', '#reset-email'],
  ]) {
    await page.goto(url);
    await expect(page.locator(field)).toBeVisible();
  }
  await page.goto('/missing-page');
  await expect(page.getByRole('link', { name: 'Ana sayfaya dön' })).toBeVisible();
});
for (const width of [1440, 768, 390, 320]) {
  for (const language of ['tr', 'en']) {
    for (const theme of ['light', 'dark']) {
      test(`layout and accessibility ${width}px ${language} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        if (width <= 900) await page.getByRole('button', { name: 'Menüyü aç' }).click();
        if (language === 'en')
          await page.getByRole('button', { name: 'English', exact: true }).last().click();
        if (theme === 'dark')
          await page
            .getByRole('button', { name: language === 'tr' ? 'Koyu temaya geç' : 'Switch to dark theme' })
            .last()
            .click();
        if (width <= 900)
          await page.getByRole('button', { name: language === 'tr' ? 'Menüyü kapat' : 'Close menu' }).click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('header').getByRole('button', { name: /Giriş yap|Sign in/ })).toHaveCount(
          0,
        );
        await expect(page.locator('header').getByRole('link', { name: /Hakkında|About/ })).toHaveCount(0);
        await expect(page.locator('.edition-line')).toHaveCount(0);
        await expect(
          page.locator('footer').getByText(/Frontend.*preview|Frontend tasarım|unofficial|resmi olmayan/),
        ).toHaveCount(0);
        await expect(page.locator('footer nav').getByRole('link')).toHaveCount(1);
        await expect(page.locator('footer nav').getByRole('button')).toHaveCount(3);
        if (width > 640) {
          for (const mode of ['login', 'register', 'reset']) {
            const panel = page.locator('#auth-panel');
            if (mode === 'register') await panel.locator('.auth-tabs button').last().click();
            if (mode === 'reset') {
              await panel.locator('.auth-tabs button').first().click();
              await panel
                .getByRole('button', { name: language === 'tr' ? 'Şifremi unuttum' : 'Forgot password?' })
                .click();
            }
            const posterBox = await page.locator('.hero-poster').boundingBox();
            const panelBox = await panel.boundingBox();
            expect(Math.abs(posterBox.y - panelBox.y)).toBeLessThanOrEqual(1);
            expect(Math.abs(posterBox.height - panelBox.height)).toBeLessThanOrEqual(1);
          }
          await page
            .locator('#auth-panel')
            .getByRole('button', { name: language === 'tr' ? 'Girişe dön' : 'Back to sign in' })
            .click();
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        }
        const agendaColors = await page.locator('.marquee-strip').evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, text: style.color };
        });
        expect(agendaColors.background).toBe(theme === 'light' ? 'rgb(237, 239, 245)' : 'rgb(29, 37, 53)');
        expect(agendaColors.text).toBe(theme === 'light' ? 'rgb(21, 33, 58)' : 'rgb(237, 242, 255)');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflow).toBe(false);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => {
          document.querySelectorAll('.reveal-pending').forEach((el) => el.classList.remove('reveal-pending'));
        });
        await page.screenshot({
          path: test.info().outputPath(`${width}-${language}-${theme}.png`),
          fullPage: true,
        });
        if (width === 1440 || width === 390)
          await page.screenshot({ path: test.info().outputPath(`hero-${width}-${language}-${theme}.png`) });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      });
    }
  }
}
