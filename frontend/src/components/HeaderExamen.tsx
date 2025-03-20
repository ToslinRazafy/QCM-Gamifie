"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Users, Trophy, LogOut, Settings, User } from "lucide-react";
import { URL_IMG_BACKEND } from "@/constant";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/examen", icon: Home },
  { label: "Examens", href: "/examen/list", icon: Users },
  { label: "Mes Resultats", href: "/examen/my-results", icon: Users },
  { label: "Mode Quiz", href: "/platform", icon: Trophy },
];

export default function HeaderExamen() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      setUser(null);
      router.push("/login");
    }
  };

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
          <Link href="/examen">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
              Examens QCM
            </h1>
          </Link>
          <div className="h-8 w-8" />
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/examen">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
              Examens QCM
            </h1>
          </Link>
          <div className="flex items-center space-x-6">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.label} className="relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 ${
                      pathname === item.href
                        ? "text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
                    } transition-colors`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
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
                      href="/examen/my-results"
                      className="flex items-center w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Mes Résultats</span>
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

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-6 py-4 flex justify-between items-center">
        <Link href="/examen">
          <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">
            Examens QCM
          </h1>
        </Link>
        <div className="flex items-center space-x-4">
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
                  href="/examen/my-results"
                  className="flex items-center w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Mes Résultats</span>
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

      {/* Mobile Bottom Bar */}
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
    </>
  );
}
