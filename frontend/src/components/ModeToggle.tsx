"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const currentClasses = Array.from(root.classList);
    const filteredClasses = currentClasses.filter(
      (cls) => cls !== "dark" && cls !== "light"
    );
    const newClasses = [resolvedTheme, ...filteredClasses];

    root.className = newClasses.join(" ");
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="relative border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
      >
        <Sun
          className={cn(
            "h-[1.2rem] w-[1.2rem] transition-all",
            resolvedTheme === "dark"
              ? "rotate-90 scale-0"
              : "rotate-0 scale-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all",
            resolvedTheme === "dark"
              ? "rotate-0 scale-100"
              : "-rotate-90 scale-0"
          )}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
}
