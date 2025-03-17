"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export function useProtectedRoute(allowedRoles?: ("ADMIN" | "USER")[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  return { isAuthenticated, isLoading, user };
}
