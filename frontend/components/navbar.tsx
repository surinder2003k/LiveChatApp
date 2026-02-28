"use client";

import { LogOut, User as UserIcon, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { NotificationsPopover } from "@/components/notifications-popover";
import type { User } from "@/lib/types";

export function Navbar({
  notifications = [],
  onAction,
  onMenuToggle
}: {
  notifications?: User[],
  onAction?: (action: string, data: any) => void,
  onMenuToggle?: () => void
}) {
  const { user, logout } = useAuth();

  return (
    <nav className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/10"
              onClick={onMenuToggle}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <Brand />
        </div>
        <div className="flex items-center gap-3">
          {onAction && <NotificationsPopover requests={notifications} onAction={onAction} />}
          <ModeToggle />
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-primary/20",
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                Login
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
