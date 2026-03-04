"use client";

import * as React from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import { getTokenFromCookie, setTokenCookie, clearTokenCookie } from "@/lib/cookies";
import { disconnectSocket } from "@/lib/socket";
import type { User } from "@/lib/types";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  logout: () => void;
  refreshMe: () => Promise<void>;
  retrySync: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useClerkAuth(); // Fixed: Use the aliased useClerkAuth

  const [state, setState] = React.useState<AuthState>(() => {
    // 1. Initial State from Storage (Instant Load)
    if (typeof window !== "undefined") {
      const t = getTokenFromCookie();
      const cachedUser = localStorage.getItem("auth_user");
      if (t && cachedUser) {
        try {
          return {
            token: t,
            user: JSON.parse(cachedUser),
            loading: false, // Instant load!
            error: null
          };
        } catch (_) { }
      }
    }
    return {
      token: null,
      user: null,
      loading: true,
      error: null
    };
  });

  const syncWithBackend = React.useCallback(async () => {
    // 1. If Clerk not ready, handle background state
    if (!isLoaded) return;

    // 2. If Clerk ready but not signed in
    if (!isSignedIn || !clerkUser) {
      localStorage.removeItem("auth_user");
      setState({ token: null, user: null, loading: false, error: null });
      return;
    }

    // 3. If signed in, run sync
    // Only set loading to true if we absolutely have nothing yet
    if (!state.token || !state.user) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No clerk token");

      const res = await apiFetch<{ token: string; user: User }>("/api/auth/sync", {
        method: "POST",
        token: clerkToken,
        body: {
          email: clerkUser.primaryEmailAddress?.emailAddress,
          avatar: clerkUser.imageUrl
        }
      });

      setTokenCookie(res.token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      setState({ token: res.token, user: res.user, loading: false, error: null });
    } catch (e: any) {
      console.error("Auth sync error:", e);
      setState(prev => ({
        ...prev,
        loading: false,
        error: prev.user ? null : (e?.message || "Authentication failed")
      }));
    }
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  React.useEffect(() => {
    syncWithBackend();
  }, [isLoaded, isSignedIn, syncWithBackend]);

  const logout = React.useCallback(async () => {
    await signOut();
    disconnectSocket();
    clearTokenCookie();
    localStorage.removeItem("auth_user");
    setState({ token: null, user: null, loading: false, error: null });
  }, [signOut]);

  const refreshMe = React.useCallback(async () => {
    const token = getTokenFromCookie();
    if (!token) return;
    try {
      const me = await apiFetch<{ user: User }>("/api/users/me", { token });
      localStorage.setItem("auth_user", JSON.stringify(me.user));
      setState(prev => ({ ...prev, user: me.user }));
    } catch (_e) { }
  }, []);

  const value: AuthContextValue = React.useMemo(
    () => ({
      ...state,
      logout,
      refreshMe,
      retrySync: syncWithBackend
    }),
    [state, logout, refreshMe, syncWithBackend]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

