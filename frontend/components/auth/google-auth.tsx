"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export function GoogleAuthSection() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { token, login } = useAuth();
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasSyncedRef = React.useRef(false);

  React.useEffect(() => {
    async function sync() {
      if (!isSignedIn || token || !user || hasSyncedRef.current) return;
      hasSyncedRef.current = true;
      setSyncing(true);
      setError(null);
      try {
        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;
        if (!email) {
          setError("No email found on Google account");
          return;
        }
        const username =
          user.username || user.fullName || user.firstName || email.split("@")[0] || "user";
        const avatar =
          user.imageUrl ||
          "";
        const res = await apiFetch<{ token: string; user: any }>("/api/auth/oauth", {
          method: "POST",
          body: JSON.stringify({ email, username, avatar })
        });
        login({ token: res.token, user: res.user });
        router.push("/chat");
      } catch (e: any) {
        setError(e?.message || "Failed to sync Google login");
      } finally {
        setSyncing(false);
      }
    }
    void sync();
  }, [isSignedIn, token, user, login, router]);

  return (
    <div className="space-y-2">
      <SignInButton mode="modal" redirectUrl="/login">
        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/40 text-primary hover:bg-primary/5"
        >
          Continue with Google
        </Button>
      </SignInButton>
      {syncing ? (
        <p className="text-xs text-muted-foreground">Signing you in with Google…</p>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

