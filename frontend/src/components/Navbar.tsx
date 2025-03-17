"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

interface NavbarProps {
  navItems: NavItem[];
  scrollToSection: (id: string) => void;
}

export default function Navbar({ navItems, scrollToSection }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isMounted, setIsMounted] = useState(false);
  const { scrollY } = useScroll();
  const navbarOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  useEffect(() => {
    setIsMounted(true);
    setActiveSection(navItems[0]?.href.replace("#", "") || "home");

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      for (const item of navItems) {
        const id = item.href.replace("#", "");
        const element = document.getElementById(id);
        if (
          element &&
          scrollPosition >= element.offsetTop &&
          scrollPosition < element.offsetTop + element.offsetHeight
        ) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  if (!isMounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[hsl(var(--primary))]">
            QCM Gamifié
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Connexion
            </Button>
            <ModeToggle />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        style={{ opacity: navbarOpacity }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[hsl(var(--primary))]">
            QCM Gamifié
          </h1>
          <ul className="flex space-x-6 items-center">
            {navItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => scrollToSection(item.href.replace("#", ""))}
                  className={`relative text-sm font-medium ${
                    activeSection === item.href.replace("#", "")
                      ? "text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
                  } transition-colors`}
                >
                  {item.label}
                  {activeSection === item.href.replace("#", "") && (
                    <motion.span
                      layoutId="underline-desktop"
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-[hsl(var(--primary))] rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              </li>
            ))}
            <li>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] rounded-full"
              >
                <Link href="/login">Connexion</Link>
              </Button>
            </li>
            <li>
              <ModeToggle />
            </li>
          </ul>
        </div>
      </motion.nav>

      {/* Mobile Bottom Navbar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shadow-lg py-2 px-4"
      >
        <div className="flex justify-between items-center max-w-md mx-auto">
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              onClick={() => scrollToSection(item.href.replace("#", ""))}
              className={`flex flex-col items-center gap-1 p-2 rounded-full ${
                activeSection === item.href.replace("#", "")
                  ? "text-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                  : "text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
              } transition-colors`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeSection === item.href.replace("#", "") ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.icon}
                </motion.div>
              ) : (
                item.icon
              )}
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="absolute top-[-60px] right-4 flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
          >
            <Link href="/login">Connexion</Link>
          </Button>
          <ModeToggle />
        </div>
      </motion.nav>
    </>
  );
}
