"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://192.168.43.49:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
          <header className="bg-[hsl(var(--card))] p-4 flex justify-end items-center gap-4 border-b border-[hsl(var(--border))] sticky top-0 z-30 shadow-sm">
            <ModeToggle />
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Déconnexion
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-[hsl(var(--background))] overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
            <Toaster richColors position="top-right" />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
