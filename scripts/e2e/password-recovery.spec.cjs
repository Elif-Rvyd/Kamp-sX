const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const user = {
  id: 'f449a9bd-16cb-4aba-bddf-1c8e8a20cc96',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'student@itu.edu.tr',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  created_at: '2026-01-01T00:00:00Z',
};

function accessToken() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email: user.email,
  })}.mock-signature`;
}

function recoveryUrl() {
  return `/auth/update-password#access_token=${accessToken()}&refresh_token=mock-refresh&expires_in=3600&token_type=bearer&type=recovery`;
}

async function mockAuth(page, { update, logout, userResponse } = {}) {
  const requests = [];
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: url.pathname, body: request.postDataJSON() });
    if (url.pathname.endsWith('/user') && request.method() === 'GET') {
      if (userResponse) return userResponse(route);
      return route.fulfill({ json: user });
    }
    if (url.pathname.endsWith('/user') && request.method() === 'PUT') {
      if (update) return update(route);
      return route.fulfill({ json: user });
    }
    if (url.pathname.endsWith('/logout')) {
      if (logout) return logout(route);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.endsWith('/token')) {
      return route.fulfill({
        json: {
          access_token: accessToken(),
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        },
      });
    }
    // Never allow a recovery test to send email or call a live Supabase project.
    return route.fulfill({ status: 400, json: { code: 'unexpected_test_request', message: 'Mock only' } });
  });
  return requests;
}

async function setPreferences(page, { language = 'tr', theme = 'light' } = {}) {
  await page.addInitScript(
    ({ language, theme }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
    },
    { language, theme },
  );
}

test('a missing recovery link offers a new reset and never shows a password form', async ({ page }) => {
  await setPreferences(page);
  const requests = await mockAuth(page);
  await page.goto('/auth/update-password');
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await page.getByRole('link', { name: 'Yeni sıfırlama bağlantısı iste' }).click();
  await expect(page.locator('#reset-email')).toBeVisible();
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(0);
});

test('an ordinary signed-in session cannot authorize a recovery page', async ({ page }) => {
  await setPreferences(page);
  const requests = await mockAuth(page);
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(user.email);
  await page.locator('#login-password').fill('ExistingPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.locator('#auth-panel [role=status]')).toContainText('Giriş yaptın');
  await page.goto('/auth/update-password');
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(0);
});

test('expired callbacks never display callback errors or credentials', async ({ page }) => {
  await setPreferences(page);
  await mockAuth(page, {
    userResponse: (route) =>
      route.fulfill({ status: 401, json: { code: 'otp_expired', message: 'raw-provider-error' } }),
  });
  await page.goto(recoveryUrl());
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('raw-provider-error');
  await expect(page).not.toHaveURL(/access_token|refresh_token/);
});

for (const state of [
  { language: 'tr', theme: 'light', width: 1440 },
  { language: 'en', theme: 'dark', width: 320 },
]) {
  test(`recovery validates, masks passwords, saves once and ends session (${state.language}, ${state.theme})`, async ({
    page,
  }) => {
    await setPreferences(page, state);
    await page.setViewportSize({ width: state.width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests = await mockAuth(page);
    await page.goto(recoveryUrl());
    const password = page.locator('#update-password');
    const confirm = page.locator('#update-confirm-password');
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(confirm).toHaveAttribute('autocomplete', 'new-password');
    await expect(page).not.toHaveURL(/access_token|refresh_token/);
    const submit = page.locator('button[type=submit]');
    await submit.click();
    await expect(password).toBeFocused();
    await password.fill('NewPassword123!');
    await confirm.fill('OtherPassword123!');
    await submit.click();
    await expect(confirm).toBeFocused();
    await expect(confirm).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#update-confirm-password-message')).toContainText(
      state.language === 'tr' ? 'aynı olmalı' : 'must match',
    );
    await confirm.fill('NewPassword123!');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: test.info().outputPath(`recovery-${state.language}-${state.theme}.png`),
      fullPage: true,
    });
    await submit.click();
    await expect(page.locator('[data-recovery-result]')).toContainText(
      state.language === 'tr' ? 'Şifren güncellendi' : 'Password updated',
    );
    await expect(page.locator('[data-recovery-result]')).toBeFocused();
    await expect(password).toHaveCount(0);
    const updates = requests.filter((request) => request.method === 'PUT');
    expect(updates).toHaveLength(1);
    expect(updates[0].body).toMatchObject({ password: 'NewPassword123!' });
    expect(requests.filter((request) => request.path.endsWith('/logout'))).toHaveLength(1);
    await page
      .getByRole('link', { name: state.language === 'tr' ? 'Girişe dön' : 'Back to sign in' })
      .click();
    await expect(page.locator('#login-identity')).toBeVisible();
  });
}

test('a failed password update preserves fields and allows a retry', async ({ page }) => {
  await setPreferences(page);
  let calls = 0;
  const requests = await mockAuth(page, {
    update: (route) => {
      calls += 1;
      return calls === 1
        ? route.fulfill({
            status: 422,
            headers: {
              'access-control-allow-origin': '*',
              'access-control-expose-headers': 'x-supabase-api-version',
              'x-supabase-api-version': '2024-01-01',
            },
            json: { code: 'weak_password', message: 'raw-provider-error' },
          })
        : route.fulfill({ json: user });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('daha güçlü bir şifre');
  await expect(page.locator('#update-password')).toHaveValue('NewPassword123!');
  await expect(page.locator('body')).not.toContainText('raw-provider-error');
  expect(requests.filter((request) => request.path.endsWith('/logout'))).toHaveLength(0);
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
});

test('slow password updates prevent duplicate submits', async ({ page }) => {
  await setPreferences(page);
  let complete;
  const gate = new Promise((resolve) => {
    complete = resolve;
  });
  const requests = await mockAuth(page, {
    update: async (route) => {
      await gate;
      await route.fulfill({ json: user });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await page
    .locator('form')
    .evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(1);
  complete();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
});

test('a saved password with failed sign-out offers sign-out retry without another update', async ({
  page,
}) => {
  await setPreferences(page);
  let logoutCalls = 0;
  const requests = await mockAuth(page, {
    logout: (route) => {
      logoutCalls += 1;
      return logoutCalls === 1
        ? route.fulfill({
            status: 500,
            json: { code: 'unexpected_failure', message: 'Mock sign-out failure' },
          })
        : route.fulfill({ status: 204 });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('Çıkış işlemi sırasında bir sorun oldu');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await page.getByRole('button', { name: 'Oturumu kapatmayı tekrar dene' }).click();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(1);
  // SDK removes local credentials even if server logout fails; the retry is
  // idempotent locally and must not resend the password or invent a new token.
  expect(logoutCalls).toBe(1);
  expect(
    await page.evaluate(() => {
      const hasSession = (storage) =>
        Object.keys(storage).some((key) => key.endsWith('-auth-token') && !!storage.getItem(key));
      return hasSession(localStorage) || hasSession(sessionStorage);
    }),
  ).toBe(false);
});
