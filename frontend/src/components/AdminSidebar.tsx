"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart,
  Book,
  List,
  Users,
  User,
  Menu,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "./AuthProvider";

export default function AdminSidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: BarChart },
    { name: "Quiz", href: "/admin/quizzes", icon: Book },
    { name: "Catégories Quizze", href: "/admin/categories", icon: List },
    { name: "Qcm", href: "/admin/qcms", icon: Book },
    { name: "Catégories QCM", href: "/admin/category-qcms", icon: List },
    { name: "Examens", href: "/admin/examens", icon: Book },
    { name: "Resultats d'examen", href: "/admin/examens/historiques", icon: List },
    { name: "Utilisateurs", href: "/admin/users", icon: Users },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
    { name: "Profil", href: "/admin/profile", icon: User },
  ];

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const sidebarContent = (
    <nav className="flex flex-col p-6 space-y-4">
      {menuItems.map((item) => (
        <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 hover:bg-[hsl(var(--muted))] transition-colors rounded-lg py-3 text-base"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Button>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <motion.div
        initial="closed"
        animate="open"
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col w-72 bg-[hsl(var(--background))] h-screen fixed top-0 left-0 border-r border-[hsl(var(--border))] z-40 shadow-md"
      >
        <div className="p-6 text-2xl font-semibold border-b border-[hsl(var(--border))]">
          {user?.firstname} {user?.lastname}
        </div>
        {sidebarContent}
      </motion.div>

      {/* Sidebar Mobile */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-6 left-6 z-50 bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))]"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-[hsl(var(--background))] p-0 border-r border-[hsl(var(--border))]"
          >
            <div className="p-6 text-2xl font-semibold border-b border-[hsl(var(--border))]">
              {user?.firstname} {user?.lastname}
            </div>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
