import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginRequest, registerRequest } from '../api/authApi';
import { registerSessionExpiredHandler } from '../api/axiosInstance';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dqp_token';
const USER_KEY = 'dqp_user';

// Reads from localStorage first (a "remembered" session), falling back to
// sessionStorage (a session-only login that shouldn't survive a full
// browser restart, but should survive an in-tab refresh).
const readStoredSession = () => {
  const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  return { storedToken, storedUser };
};

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const { storedToken, storedUser } = readStoredSession();
    if (storedToken && storedUser) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        // JWT `exp` is in seconds since epoch; Date.now() is in milliseconds.
        // Multiply exp by 1000 before comparing, or every stored token looks
        // expired (since exp will almost always be numerically smaller than
        // Date.now()) and a valid session gets wiped on every page load.
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          clearStoredSession();
        }
      } catch (_e) {
        clearStoredSession();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
      setSessionExpired(true);
    });
  }, []);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const { data } = await loginRequest({ email, password });
    setToken(data.token);
    setUser(data.user);
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } else {
      // Session-only: persists across refreshes in this tab, but not across
      // browser restarts or new tabs - and must NOT also be written to
      // localStorage, or "Remember me" being unchecked has no effect.
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    setSessionExpired(false);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerRequest(payload);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredSession();
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      // Keep whichever storage currently holds the session in sync.
      if (localStorage.getItem(USER_KEY)) {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } else if (sessionStorage.getItem(USER_KEY)) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};