"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation"; // Ajout de usePathname
import axios from "axios";
import api from "@/lib/api";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  pseudo: string;
  email: string;
  avatar: string;
  country: string;
  bio: string;
  xp: number;
  league: string;
  duel_wins: number;
  role: "ADMIN" | "USER";
  is_active: boolean;
  status: string;
  quizzes: any[];
  user_responses: any[];
  challengesAsPlayer1: any[];
  challengesAsPlayer2: any[];
  won_challenges: any[];
  badges: any[];
  history: any[];
  friends: any[];
  friend_of: any[];
  posts: any[];
  likes: any[];
  comments: any[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        console.log("User chargé dans AuthProvider:", response.data);

        const protectedRoutes = ["/platform", "/platform/friends", "/platform/posts", "/admin", "/platform/challenges"];
        const isOnProtectedRoute = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (!isOnProtectedRoute) {
          if (response.data.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/platform");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router, pathname]); // Ajout de pathname comme dépendance

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          "/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      router.push("/login");
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}