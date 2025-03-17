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
    { name: "Catégories", href: "/admin/categories", icon: List },
    { name: "Utilisateurs", href: "/admin/users", icon: Users },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
    { name: "Profil", href: "/admin/profile", icon: User },
  ];

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  const sidebarContent = (
    <nav className="flex-1 p-4 space-y-1">
      {menuItems.map((item) => (
        <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 hover:bg-[hsl(var(--muted))] transition-colors rounded-lg py-2 text-sm"
          >
            <item.icon className="h-4 w-4" />
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
        className="hidden md:flex flex-col w-64 bg-[hsl(var(--background))] h-screen fixed top-0 left-0 border-r border-[hsl(var(--border))] z-40 shadow-md"
      >
        <div className="p-4 text-xl font-semibold border-b border-[hsl(var(--border))]">
          { user?.firstname } { user?.lastname}
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
              className="fixed top-4 left-4 z-50 bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-[hsl(var(--background))] p-0 border-r border-[hsl(var(--border))]"
          >
            <div className="p-4 text-xl font-semibold border-b border-[hsl(var(--border))]">
              { user?.firstname } {user?.lastname}
            </div>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
