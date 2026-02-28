"use client";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight text-2xl flex items-center gap-0", className)}>
      <span className="text-foreground">Chat</span>
      <span className="text-blue-500">App</span>
    </span>
  );
}
