"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { Brand } from "@/components/brand";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { token } = useAuth();
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
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse font-medium">Syncing your account...</p>
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
