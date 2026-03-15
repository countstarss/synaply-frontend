"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_TOKEN_STORAGE_KEY,
  AuthUser,
  fetchMe,
  loginWithEmailPassword,
  registerWithEmailPassword,
} from "@/lib/auth-client";

type RegisterInput = {
  name?: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function setStoredToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

function clearStoredToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = token ?? getStoredToken();

    if (!activeToken) {
      setUser(null);
      return;
    }

    try {
      const me = await fetchMe(activeToken);
      setToken(activeToken);
      setUser(me);
    } catch {
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    const init = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await fetchMe(storedToken);
        setToken(storedToken);
        setUser(me);
      } catch {
        clearStoredToken();
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await registerWithEmailPassword(input);
    setStoredToken(result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginWithEmailPassword(input);
    setStoredToken(result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      register,
      login,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, refreshProfile, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
