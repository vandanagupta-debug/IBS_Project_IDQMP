import { Page } from '@playwright/test';

const TOKEN_KEY = 'dqp_token';
const USER_KEY = 'dqp_user';

/**
 * Matches app's own mock token shape in frontend/src/api/authApi.js
 * (generateMockToken): plain base64 via btoa(), and - importantly -
 * `exp`/`iat` in MILLISECONDS (Date.now()), not the JWT-standard seconds.
 * AuthContext compares `payload.exp > Date.now()` directly, so the units
 * must match exactly or the app treats the seeded token as expired.
 */
function fakeJwt(userId: string, email: string, role: string, sessionMs = 1000 * 60 * 60 * 8): string {
  const b64 = (obj: Record<string, unknown>) => Buffer.from(JSON.stringify(obj)).toString('base64');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({
    sub: userId,
    email,
    role,
    iat: Date.now(),
    exp: Date.now() + sessionMs,
  });
  const signature = Buffer.from(`${userId}-signature`).toString('base64');
  return `${header}.${payload}.${signature}`;
}

export async function loginAsTestUser(page: Page): Promise<void> {
  const user = {
    id: 'usr_e2e01',
    name: 'E2E Test User',
    email: 'e2e@example.com',
    role: 'Admin',
  };

  await page.addInitScript(
    ({ tokenKey, userKey, token, user }) => {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(userKey, JSON.stringify(user));
    },
    {
      tokenKey: TOKEN_KEY,
      userKey: USER_KEY,
      token: fakeJwt(user.id, user.email, user.role),
      user,
    },
  );
}