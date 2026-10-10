const { test, expect } = require('@playwright/test');

const email = 'student@itu.edu.tr';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  identities: [],
};

function sessionResponse() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: expiresAt,
  })}.fake_signature_for_local_test`;
  return {
    access_token: accessToken,
    refresh_token: 'fake_refresh_token_for_local_test',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
}

async function mockAuth(page, handlers = {}) {
  const requests = [];
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const operation = url.pathname.split('/auth/v1/')[1];
    const body = request.postDataJSON();
    requests.push({ operation, method: request.method(), body, url });
    const handler = handlers[operation];
    const response = handler
      ? await handler({ request, body, url })
      : operation === 'user'
        ? { status: 200, body: user }
        : operation === 'logout'
          ? { status: 204 }
          : { status: 400, body: { code: 'unexpected_failure', msg: 'UNEXPECTED_TEST_REQUEST' } };
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'x-supabase-api-version',
        'x-supabase-api-version': '2024-01-01',
      },
      body: response.body === undefined ? '' : JSON.stringify(response.body),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem('kampusx-language', 'tr');
    localStorage.setItem('kampusx-theme', 'light');
  });
  return requests;
}

for (const remember of [false, true]) {
  test(`login uses ${remember ? 'persistent' : 'tab-scoped'} session storage`, async ({ page }) => {
    const response = sessionResponse();
    const requests = await mockAuth(page, { token: () => ({ body: response }) });
    await page.goto('/auth/login');
    await page.locator('#login-identity').fill(email);
    await page.locator('#login-password').fill('LocalTestPassword123!');
    const rememberControl = page.locator('input[formcontrolname=remember]');
    await rememberControl.setChecked(remember);
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page.locator('#auth-panel .success-message')).toBeVisible();
    const submitted = requests.find(({ operation }) => operation === 'token');
    expect(submitted.body.email).toBe(email);
    expect(submitted.body.password).toBe('LocalTestPassword123!');
    const persisted = await page.evaluate((accessToken) => {
      const containsToken = (storage) =>
        Object.keys(storage).some((key) => (storage.getItem(key) || '').includes(accessToken));
      return { local: containsToken(localStorage), session: containsToken(sessionStorage) };
    }, response.access_token);
    expect(persisted).toEqual({ local: remember, session: !remember });
  });
}

test('invalid credentials display a safe localized error and allow retry', async ({ page }) => {
  let failed = true;
  const requests = await mockAuth(page, {
    token: () =>
      failed
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.click();
  await expect(page.locator('#auth-panel [role=alert]')).toBeVisible();
  await expect(page.locator('#auth-panel [role=alert]')).toContainText('E-posta veya şifre yanlış');
  await expect(page.locator('#auth-panel')).not.toContainText('PRIVATE_BACKEND_ERROR');
  await expect(submit).toBeEnabled();
  failed = false;
  await submit.click();
  await expect(page.locator('#auth-panel .success-message')).toBeVisible();
  expect(requests.filter(({ operation }) => operation === 'token')).toHaveLength(2);
});

test('registration sends metadata and displays email-verification guidance', async ({ page }) => {
  const requests = await mockAuth(page, {
    signup: () => ({ body: { ...user, email_confirmed_at: null, confirmed_at: null } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.locator('#auth-panel .success-message')).toBeVisible();
  await expect(page.locator('#auth-panel .success-message')).toContainText(/e-posta/i);
  const submitted = requests.find(({ operation }) => operation === 'signup');
  expect(submitted.body.email).toBe(email);
  expect(submitted.body.data.username).toBe('student');
  expect(submitted.body.data).not.toHaveProperty('role');
});

test('reset requests do not expose whether an account exists', async ({ page }) => {
  const requests = await mockAuth(page, { recover: () => ({ body: {} }) });
  await page.goto('/auth/forgot-password');
  await page.locator('#reset-email').fill(email);
  await page.locator('#auth-panel button[type=submit]').click();
  const success = page.locator('.reset-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText(/hesap|kayıtlı/i);
  await expect(success).toBeFocused();
  expect(requests.find(({ operation }) => operation === 'recover').body.email).toBe(email);
});
