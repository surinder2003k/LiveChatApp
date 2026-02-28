"use client";

import { SignIn } from "@clerk/nextjs";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 bg-edtech">
      <div className="mb-8 scale-110">
        <Brand />
      </div>
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
    </div>
  );
}
