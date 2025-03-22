"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import HeaderExamen from "@/components/HeaderExamen";
import { usePathname } from "next/navigation";

export default function ExamenLayout({ children }: { children: ReactNode }) {
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
        <HeaderExamen />
        <main className="flex-1 pt-20 pb-24 md:pb-6 px-6">
          <div className="max-w-7xl mx-auto">{children}</div>
          <Toaster richColors />
        </main>
      </div>
    </AuthProvider>
  );
}
