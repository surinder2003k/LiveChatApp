"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

export function ModeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="border-none bg-background/60">
        <Sun className="h-[1.2rem] w-[1.2rem] opacity-0" />
      </Button>
    );
  }

  const isDark = (theme === "dark" || resolvedTheme === "dark") ?? false;

  return (
    <Toggle
      aria-label="Toggle theme"
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      className="border border-input bg-background/60 backdrop-blur"
    >
      {isDark ? <Moon className="text-indigo-400" /> : <Sun className="text-amber-500" />}
      <span className="sr-only">Toggle theme</span>
    </Toggle>
  );
}

