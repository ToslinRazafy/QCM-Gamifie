"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords, Users, Zap } from "lucide-react";
import { useRef } from "react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const navItems = [
    { label: "Accueil", href: "#home", icon: <Zap className="h-6 w-6" /> },
    {
      label: "Fonctionnalités",
      href: "#features",
      icon: <Trophy className="h-6 w-6" />,
    },
    { label: "À propos", href: "#about", icon: <Users className="h-6 w-6" /> },
    {
      label: "Contact",
      href: "#contact",
      icon: <Swords className="h-6 w-6" />,
    },
  ];

  const sectionRefs = {
    home: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (id: string) => {
    const element = sectionRefs[id as keyof typeof sectionRefs].current;
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar navItems={navItems} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section
        id="home"
        ref={sectionRefs.home}
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-10 md:pt-24 bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(var(--muted))]"
      >
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[hsl(var(--primary))]"
        >
          QCM Gamifié
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-base md:text-lg lg:text-xl mb-8 max-w-xl text-[hsl(var(--foreground))] leading-relaxed"
        >
          Testez vos connaissances, défiez vos amis et grimpez dans les ligues
          avec une expérience ludique et interactive !
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            asChild
            size="lg"
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-full shadow-lg"
          >
            <Link href="/login">Commencer</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] rounded-full"
          >
            <Link href="#features">Découvrir</Link>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-12 w-full max-w-2xl"
        >
          <Image
            src="/images/hero.png"
            alt="Plateforme QCM"
            width={600}
            height={400}
            className="rounded-xl shadow-xl object-cover"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={sectionRefs.features}
        className="py-16 px-4 md:py-20 bg-[hsl(var(--secondary))]"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--primary))]"
        >
          Fonctionnalités
        </motion.h2>
        <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Trophy className="h-10 w-10 text-[hsl(var(--primary))]" />,
              title: "QCM Interactifs",
              desc: "Des quizzes variés pour tester vos compétences et gagner des points.",
            },
            {
              icon: <Swords className="h-10 w-10 text-[hsl(var(--primary))]" />,
              title: "Défis Amicaux",
              desc: "Affrontez vos amis dans des duels compétitifs.",
            },
            {
              icon: <Users className="h-10 w-10 text-[hsl(var(--primary))]" />,
              title: "Communauté",
              desc: "Connectez-vous, partagez et commentez avec d'autres joueurs.",
            },
            {
              icon: <Zap className="h-10 w-10 text-[hsl(var(--primary))]" />,
              title: "Progression",
              desc: "Badges, ligues et classements pour une expérience gamifiée.",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
            >
              <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--card-foreground))]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        ref={sectionRefs.about}
        className="py-16 px-4 md:py-20 bg-[hsl(var(--background))]"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--primary))]"
        >
          À propos
        </motion.h2>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2"
          >
            <Image
              src="/images/about.png"
              alt="À propos"
              width={400}
              height={300}
              className="rounded-xl shadow-lg object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 text-center md:text-left"
          >
            <p className="text-base md:text-lg mb-4 text-[hsl(var(--foreground))] leading-relaxed">
              QCM Gamifié transforme l’apprentissage en une aventure amusante et
              compétitive.
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Rejoignez-nous pour devenir un maître des QCM tout en vous amusant
              !
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        ref={sectionRefs.contact}
        className="py-16 px-4 md:py-20 bg-[hsl(var(--secondary))]"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--primary))]"
        >
          Contactez-nous
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-center"
        >
          <p className="text-base md:text-lg mb-6 text-[hsl(var(--foreground))] leading-relaxed">
            Questions ou suggestions ? Notre équipe est là pour vous !
          </p>
          <Button
            size="lg"
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-full shadow-lg"
            asChild
          >
            <a href="mailto:support@qcmgamifie.com">Envoyer un email</a>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] text-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          © 2025 QCM Gamifié. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
