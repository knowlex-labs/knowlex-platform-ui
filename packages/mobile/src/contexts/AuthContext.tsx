import * as React from 'react';
import type { AuthContextValue, AuthState, LoginCredentials, SignupData, User } from '@knowlex/core/types';
import { authApi } from '@knowlex/core/api/auth-api';
import { userApi } from '@knowlex/core/api/user-api';
import { getAdapters } from '@knowlex/core/api/runtime';
import { subscribe, unsubscribe } from '@/adapters/event-bus';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_ID_KEY = 'auth_user_id';

function setAuthTokens(token: string | null, refreshToken: string | null, userId: string | null = null) {
  const { storage } = getAdapters();
  if (token) storage.setItem(AUTH_TOKEN_KEY, token);
  else storage.removeItem(AUTH_TOKEN_KEY);
  if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  else storage.removeItem(REFRESH_TOKEN_KEY);
  if (userId) storage.setItem(USER_ID_KEY, userId);
  else storage.removeItem(USER_ID_KEY);
}

function mapUser(data: { id: string; username: string; email: string; firstName: string; lastName: string; mobileNumber?: string; bench?: string; createdAt: string }): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.mobileNumber,
    bench: data.bench,
    createdAt: new Date(data.createdAt),
  };
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isRestoringSession, setIsRestoringSession] = React.useState(true);

  // Restore session on mount
  React.useEffect(() => {
    const restoreSession = async () => {
      const token = getAdapters().storage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const userResponse = await userApi.getCurrentUser();
        if (userResponse.status === 'success' && userResponse.data) {
          getAdapters().storage.setItem(USER_ID_KEY, userResponse.data.id);
          setAuthState({ isAuthenticated: true, user: mapUser(userResponse.data) });
        } else {
          setAuthTokens(null, null, null);
        }
      } catch {
        setAuthTokens(null, null, null);
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, []);

  // Handle session expiry via event bus
  React.useEffect(() => {
    const handleSessionExpired = () => {
      setAuthTokens(null, null, null);
      setAuthState({ isAuthenticated: false, user: null });
    };

    subscribe('auth:session-expired', handleSessionExpired);
    return () => unsubscribe('auth:session-expired', handleSessionExpired);
  }, []);

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login({
      username: credentials.username,
      password: credentials.password,
    });

    setAuthTokens(response.token, response.refreshToken, response.user.id);

    try {
      const userResponse = await userApi.getCurrentUser();
      if (userResponse.status === 'success' && userResponse.data) {
        getAdapters().storage.setItem(USER_ID_KEY, userResponse.data.id);
        setAuthState({ isAuthenticated: true, user: mapUser(userResponse.data) });
      } else {
        setAuthState({ isAuthenticated: true, user: mapUser(response.user) });
      }
    } catch {
      setAuthState({ isAuthenticated: true, user: mapUser(response.user) });
    }
  }, []);

  const signup = React.useCallback(async (data: SignupData) => {
    await authApi.register({
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
      city: data.bench || data.city,
      bench: data.bench,
    });
    await login({ username: data.username, password: data.password });
  }, [login]);

  const googleLogin = React.useCallback(async (idToken: string) => {
    const response = await authApi.googleAuth(idToken);
    setAuthTokens(response.token, response.refreshToken, response.user.id);

    try {
      const userResponse = await userApi.getCurrentUser();
      if (userResponse.status === 'success' && userResponse.data) {
        getAdapters().storage.setItem(USER_ID_KEY, userResponse.data.id);
        setAuthState({ isAuthenticated: true, user: mapUser(userResponse.data) });
      } else {
        setAuthState({ isAuthenticated: true, user: mapUser(response.user) });
      }
    } catch {
      setAuthState({ isAuthenticated: true, user: mapUser(response.user) });
    }
  }, []);

  const continueAsGuest = React.useCallback(async () => {
    // No demo credentials on mobile — skip for now
  }, []);

  const updateProfile = React.useCallback(async (data: { bench?: string }) => {
    await userApi.updateProfile(data);
    setAuthState((prev) =>
      prev.user ? { ...prev, user: { ...prev.user, ...data } } : prev
    );
  }, []);

  const logout = React.useCallback(() => {
    setAuthTokens(null, null, null);
    setAuthState({ isAuthenticated: false, user: null });
  }, []);

  const value: AuthContextValue = {
    ...authState,
    login,
    signup,
    googleLogin,
    continueAsGuest,
    logout,
    updateProfile,
    isRestoringSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
