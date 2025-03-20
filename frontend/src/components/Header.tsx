"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Settings,
  User,
  Home,
  Trophy,
  Users,
  MessageSquare,
  Clock,
  SwitchCamera,
  Book,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSocket, registerUser, isSocketConnected } from "@/lib/socket";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { URL_IMG_BACKEND } from "@/constant";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Quizzes", href: "/platform", icon: Home },
  { label: "Amis", href: "/platform/friends", icon: Users },
  { label: "Défis", href: "/platform/challenges", icon: Trophy },
  { label: "Posts", href: "/platform/posts", icon: MessageSquare },
  { label: "Historique", href: "/platform/history", icon: Clock },
  { label: "Mode Qcm", href: "/examen", icon: Book },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingChallenges, setPendingChallenges] = useState(0);
  const [isSocketConnectedState, setIsSocketConnectedState] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("/friends");
      const requests = res.data.filter(
        (f: any) => f.friend_id === user?.id && f.status === "pending"
      ).length;
      setPendingRequests(requests);
    } catch (err) {
      console.error("Erreur lors du chargement des demandes en attente:", err);
      setPendingRequests(0);
    }
  };

  const fetchPendingChallenges = async () => {
    try {
      const res = await api.get("/lobby");
      const challenges = res.data.pending.filter(
        (challenge) =>
          challenge.player2_id === user.id && challenge.player1_id !== user.id
      ).length;
      setPendingChallenges(challenges);
    } catch (err) {
      console.error("Erreur lors du chargement des défis en attente:", err);
      setPendingChallenges(0);
    }
  };

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

  useEffect(() => {
    if (!user || !isMounted) return;

    fetchPendingRequests();
    fetchPendingChallenges();

    const token = localStorage.getItem("token") || "";
    const socket = getSocket(token);

    socket.on("connect", () => {
      console.log("Socket connecté avec ID:", socket.id);
      registerUser(socket, user.id);
      setIsSocketConnectedState(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket déconnecté");
      setIsSocketConnectedState(false);
    });

    socket.on("challenge.created", (e: any) => {
      if (e.challenge.player2_id === user.id) {
        console.log("Nouveau défi reçu dans Header:", e.challenge);
        setPendingChallenges((prev) => prev + 1);
      }
    });

    socket.on("challenge.accepted", (e: any) => {
      if (
        e.challenge.player2_id === user.id ||
        e.challenge.player1_id === user.id
      ) {
        setPendingChallenges((prev) => Math.max(prev - 1, 0));
      }
    });

    socket.on("challenge.declined", (e: any) => {
      if (
        e.challenge.player1_id === user.id ||
        e.challenge.player2_id === user.id
      ) {
        setPendingChallenges((prev) => Math.max(prev - 1, 0));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("challenge.created");
      socket.off("challenge.accepted");
      socket.off("challenge.declined");
    };
  }, [user, isMounted]);

  const barVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  const itemVariants = {
    inactive: { scale: 1, y: 0 },
    active: {
      scale: 1.1,
      y: -5,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/platform">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
              QCM Gamifié
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8" />
          </div>
        </div>
      </header>
    );
  }

  if(!user?.is_active) {
    router.push("/platform/settings");
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/platform">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
              QCM Gamifié
            </h1>
          </Link>
          <div className="flex items-center space-x-6">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.label} className="relative">
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-2 ${
                      pathname === item.href
                        ? "text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
                    } transition-colors`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.label === "Amis" && pendingRequests > 0 && (
                      <Badge className="absolute -top-2 -right-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-1.5 py-0.5">
                        {pendingRequests}
                      </Badge>
                    )}
                    {item.label === "Défis" && pendingChallenges > 0 && (
                      <Badge className="absolute -top-2 -right-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-1.5 py-0.5">
                        {pendingChallenges}
                      </Badge>
                    )}
                    {pathname === item.href && (
                      <motion.span
                        layoutId="underline"
                        className="absolute left-0 right-0 bottom-[-4px] h-1 bg-[hsl(var(--primary))]"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <DropdownMenu
                open={isDesktopOpen}
                onOpenChange={setIsDesktopOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`${URL_IMG_BACKEND}/${user?.avatar}`}
                          alt={user?.name || "Utilisateur"}
                        />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/platform/friends/${user?.id}`}
                      className="flex items-center w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/platform/settings"
                      className="flex items-center w-full"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center w-full cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModeToggle />
            </div>
          </div>
        </div>
      </motion.nav>

      <motion.div
        variants={barVariants}
        initial="hidden"
        animate="visible"
        className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 py-3 shadow-xl rounded-xl"
      >
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center relative"
            >
              <motion.div
                variants={itemVariants}
                animate={pathname === item.href ? "active" : "inactive"}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center ${
                  pathname === item.href
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--foreground))]"
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.label === "Amis" && pendingRequests > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-1.5 py-0.5">
                    {pendingRequests}
                  </Badge>
                )}
                {item.label === "Défis" && pendingChallenges > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-1.5 py-0.5">
                    {pendingChallenges}
                  </Badge>
                )}
              </motion.div>
              {pathname === item.href && (
                <motion.div
                  layoutId="mobile-underline"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-1 w-8 mt-1 bg-[hsl(var(--primary))] rounded-full"
                />
              )}
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-6 py-4 flex justify-between items-center">
        <Link href="/platform">
          <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
            QCM Gamifié
          </h1>
        </Link>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground"></span>
          <ModeToggle />
          <DropdownMenu open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`${URL_IMG_BACKEND}/${user?.avatar}`}
                    alt={user?.name || "Utilisateur"}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link
                  href={`/platform/friends/${user?.id}`}
                  className="flex items-center w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil ssdsd</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/platform/settings"
                  className="flex items-center w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center w-full cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
