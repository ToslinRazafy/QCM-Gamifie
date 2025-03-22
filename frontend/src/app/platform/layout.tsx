"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const currentClasses = Array.from(root.classList);
    const filteredClasses = currentClasses.filter(
      (cls) => cls !== "theme-platform" && cls !== "theme-examen"
    );
    const newClasses = [...filteredClasses];

    if (currentClasses.includes("dark")) {
      newClasses.unshift("dark");
    } else if (currentClasses.includes("light")) {
      newClasses.unshift("light");
    }

    if (pathname.startsWith("/examen")) {
      newClasses.push("theme-examen");
    } else {
      newClasses.push("theme-platform");
    }

    root.className = newClasses.join(" ");
  }, [pathname]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
        <Header />
        <main className="flex-1 px-6 pb-6 pt-20 md:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
          <Toaster richColors />
        </main>
      </div>
    </AuthProvider>
  );
}
