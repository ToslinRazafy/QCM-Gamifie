"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import HeaderExamen from "@/components/HeaderExamen";

export default function ExamenLayout({ children }: { children: ReactNode }) {
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
