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
  const { getToken, signOut } = useClerkAuth();

  const [state, setState] = React.useState<AuthState>({
    token: null,
    user: null,
    loading: true,
    error: null
  });

  const syncWithBackend = React.useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setState({ token: null, user: null, loading: false, error: null });
      return;
    }

    try {
      // Get a token for our backend (we'll use the clerk token as the bearer)
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("No clerk token");

      // Sign in / sync user to our mongo db
      const res = await apiFetch<{ token: string; user: User }>("/api/auth/sync", {
        method: "POST",
        token: clerkToken, // Sending clerk token to sync endpoint
        body: JSON.stringify({
          email: clerkUser.primaryEmailAddress?.emailAddress,
          username: clerkUser.username || clerkUser.firstName || "User",
          avatar: clerkUser.imageUrl
        })
      });

      setTokenCookie(res.token);
      setState({ token: res.token, user: res.user, loading: false, error: null });
    } catch (e: any) {
      console.error("Auth sync error:", e);
      setState({ token: null, user: null, loading: false, error: e?.message || "Authentication failed" });
    }
  }, [isSignedIn, clerkUser, getToken]);

  React.useEffect(() => {
    if (isLoaded) {
      syncWithBackend();
    }
  }, [isLoaded, isSignedIn, syncWithBackend]);

  const logout = React.useCallback(async () => {
    await signOut();
    disconnectSocket();
    clearTokenCookie();
    setState({ token: null, user: null, loading: false, error: null });
  }, [signOut]);

  const refreshMe = React.useCallback(async () => {
    const token = getTokenFromCookie();
    if (!token) return;
    try {
      const me = await apiFetch<{ user: User }>("/api/users/me", { token });
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

