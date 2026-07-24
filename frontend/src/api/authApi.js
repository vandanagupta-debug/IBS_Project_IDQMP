import { simulateRequest } from './mockAdapter';
import { MOCK_USERS } from '../utils/mockData';

// Generates a fake but structurally valid JWT for demo purposes.
const generateMockToken = (user) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 8, // 8 hour session
    })
  );
  const signature = btoa(`${user.id}-signature`);
  return `${header}.${payload}.${signature}`;
};

export const loginRequest = async ({ email, password }) => {
  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return simulateRequest(null, { delay: 700 }).then(() => {
      throw { response: { status: 401, data: { message: 'Invalid email or password.' } } };
    });
  }
  const token = generateMockToken(user);
  const { password: _pw, ...safeUser } = user;
  return simulateRequest({ token, user: safeUser }, { delay: 800 });
};

export const registerRequest = async ({ name, email, password: _password, role = 'Analyst' }) => {
  const exists = MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return simulateRequest(null, { delay: 600 }).then(() => {
      throw { response: { status: 409, data: { message: 'An account with this email already exists.' } } };
    });
  }
  const newUser = {
    id: `usr_${Math.floor(Math.random() * 9000) + 1000}`,
    name,
    email,
    role,
    avatar: `https://i.pravatar.cc/150?u=${email}`,
    lastLogin: new Date().toISOString(),
  };
  const token = generateMockToken(newUser);
  return simulateRequest({ token, user: newUser }, { delay: 900 });
};

export const forgotPasswordRequest = async ({ email }) => {
  return simulateRequest({ message: `Password reset instructions sent to ${email}.` }, { delay: 700 });
};

export const resetPasswordRequest = async ({ token: _token, newPassword: _newPassword }) => {
  return simulateRequest({ message: 'Password reset successful.' }, { delay: 700 });
};

export const updateProfileRequest = async (updates) => {
  return simulateRequest({ ...updates }, { delay: 500 });
};

export const changePasswordRequest = async ({ currentPassword: _currentPassword, newPassword: _newPassword }) => {
  return simulateRequest({ message: 'Password changed successfully.' }, { delay: 600 });
};