"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords, Users, Zap } from "lucide-react";
import { useRef, useState } from "react";
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

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { src: "/hero.png", alt: "Accueil de la plateforme" },
    { src: "/hero2.png", alt: "Amis" },
    { src: "/hero3.png", alt: "Défi" },
    { src: "/hero4.png", alt: "Post" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar navItems={navItems} scrollToSection={scrollToSection} />

      {/* Hero Section avec Carrousel */}
      <section
        id="home"
        ref={sectionRefs.home}
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-10 md:pt-24 bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(var(--muted))] relative overflow-hidden"
      >
        {/* Contenu textuel au-dessus de l'image */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-20 mb-6"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(var(--primary))]">
            QCM Gamifié
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="z-20 text-base md:text-lg lg:text-xl mb-8 max-w-xl text-[hsl(var(--foreground))] leading-relaxed"
        >
          Testez vos connaissances, défiez vos amis et grimpez dans les ligues
          avec une expérience ludique et interactive !
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="z-20 flex flex-col sm:flex-row gap-4 mb-8"
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

        {/* Carrousel d'images avec fond flouté */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full relative"
          >
            <Image
              src={slides[currentSlide].src}
              alt={slides[currentSlide].alt}
              fill
              className="object-cover rounded-xl shadow-xl"
              priority
            />
            {/* Fond flouté avec faible opacité */}
            <div className="absolute inset-0 bg-black/60  z-10"></div>
          </motion.div>

          {/* Boutons de navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-2 rounded-full z-20 hover:bg-[hsl(var(--primary))]/80"
          >
            ❮
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-2 rounded-full z-20 hover:bg-[hsl(var(--primary))]/80"
          >
            ❯
          </button>

          {/* Indicateurs de diapositives */}
          <div className="absolute bottom-4 flex gap-2 z-20">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full ${
                  currentSlide === index
                    ? "bg-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--muted-foreground))] opacity-50"
                }`}
              />
            ))}
          </div>
        </div>
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
              src="/hero.png"
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
            <a href="mailto:razafitosy@gmail.com">Envoyer un email</a>
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
