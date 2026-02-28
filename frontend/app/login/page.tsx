"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { token, error, retrySync } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && token) {
      router.push("/chat");
    }
  }, [isLoaded, isSignedIn, token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 bg-edtech">
      <div className="mb-8 scale-110">
        <Brand />
      </div>
      {isSignedIn && !token ? (
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          {error ? (
            <>
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2">
                <p className="font-bold uppercase tracking-tight">Sync Failed</p>
                <p className="opacity-80">{error}</p>
              </div>
              <Button onClick={retrySync} className="rounded-full px-8 bg-primary hover:bg-primary/90">
                Retry Connection
              </Button>
            </>
          ) : (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="space-y-1">
                <p className="text-foreground font-bold text-lg">Syncing Account</p>
                <p className="text-muted-foreground animate-pulse text-sm">Our backend is waking up, please wait...</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <SignIn
          redirectUrl="/chat"
          appearance={{
            elements: {
              card: "glass border-none shadow-2xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "glass border-primary/20 hover:bg-primary/10",
              formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-opacity",
              footerActionLink: "text-primary hover:text-primary/80",
            }
          }}
        />
      )}
    </div>
  );
}
