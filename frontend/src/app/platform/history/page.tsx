"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { User } from "@/types";

export default function HistoryPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await api.get("/me");
        console.log("Réponse de /me :", res.data); // Pour déboguer
        setUserData(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        toast.error("Impossible de charger l'historique");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && currentUser) {
      fetchUserData();
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-6">
          <Skeleton className="h-12 w-1/2 mx-auto rounded-lg bg-[hsl(var(--muted))] opacity-50" />
          <Skeleton className="h-64 w-full rounded-xl bg-[hsl(var(--muted))] opacity-50" />
          <Skeleton className="h-64 w-full rounded-xl bg-[hsl(var(--muted))] opacity-50" />
          <Skeleton className="h-64 w-full rounded-xl bg-[hsl(var(--muted))] opacity-50" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-6 flex items-center justify-center text-[hsl(var(--foreground))]">
        <p>Erreur : Données non disponibles</p>
      </div>
    );
  }

  // Fusionner les challenges avec vérification des données
  const allChallenges = [
    ...(userData.challenges_as_player1 || []),
    ...(userData.challenges_as_player2 || []).filter(
      (c2) =>
        !(userData.challenges_as_player1 || []).some((c1) => c1.id === c2.id)
    ),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--muted))/0.2] to-[hsl(var(--background))] opacity-80 z-0" />
      <div className="absolute inset-0 bg-[url('/grid.png')] bg-repeat opacity-10 z-0" />

      <div className="relative z-10 container mx-auto max-w-4xl py-12">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--primary))] text-center mb-12 tracking-tight drop-shadow-md"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Historique
        </motion.h1>

        {/* Historique des points XP */}
        <motion.div variants={cardVariants} whileHover="hover" className="mb-8">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-4">
              <CardTitle className="text-xl font-bold tracking-wide">
                Progression XP ({userData.xp} XP)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--primary))] scrollbar-track-[hsl(var(--muted))]">
              {userData.history && userData.history.length > 0 ? (
                <ul className="space-y-4">
                  {userData.history
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((entry) => (
                      <motion.li
                        key={entry.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className={`p-4 rounded-lg shadow-sm border border-[hsl(var(--border))] ${
                          entry.value && entry.value >= 0
                            ? "bg-[hsl(var(--primary))/0.1]"
                            : "bg-[hsl(var(--destructive))/0.1]"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{entry.description}</span>
                          <span
                            className={`font-bold ${
                              entry.value && entry.value >= 0
                                ? "text-[hsl(var(--primary))]"
                                : "text-[hsl(var(--destructive))]"
                            }`}
                          >
                            {entry.value !== null
                              ? entry.value >= 0
                                ? `+${entry.value}`
                                : entry.value
                              : "N/A"}{" "}
                            XP
                          </span>
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </motion.li>
                    ))}
                </ul>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))] text-center">
                  Aucun historique XP
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Historique des badges */}
        <motion.div variants={cardVariants} whileHover="hover" className="mb-8">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[hsl(var(--secondary))] py-4">
              <CardTitle className="text-xl font-bold text-[hsl(var(--secondary-foreground))] tracking-wide">
                Trophées obtenus ({(userData.badges || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--primary))] scrollbar-track-[hsl(var(--muted))]">
              {userData.badges && userData.badges.length > 0 ? (
                <ul className="space-y-4">
                  {userData.badges
                    .sort(
                      (a, b) =>
                        new Date(b.pivot?.earned_at || b.created_at).getTime() -
                        new Date(a.pivot?.earned_at || a.created_at).getTime()
                    )
                    .map((badge) => (
                      <motion.li
                        key={badge.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className="p-4 rounded-lg shadow-sm border border-[hsl(var(--border))] bg-[hsl(var(--accent))/0.2]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-[hsl(var(--accent-foreground))]">
                            {badge.name}
                          </span>
                          <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                            Obtenu
                          </Badge>
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {badge.description || "Aucune description"}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {new Date(
                            badge.pivot?.earned_at || badge.created_at
                          ).toLocaleString()}
                        </p>
                      </motion.li>
                    ))}
                </ul>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))] text-center">
                  Aucun trophée obtenu
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Historique des duels/challenges */}
        <motion.div variants={cardVariants} whileHover="hover">
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-4">
              <CardTitle className="text-xl font-bold tracking-wide">
                Duels & Challenges ({allChallenges.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--primary))] scrollbar-track-[hsl(var(--muted))]">
              {allChallenges.length > 0 ? (
                <ul className="space-y-4">
                  {allChallenges.map((challenge) => {
                    const isWinner = challenge.winner_id === currentUser?.id;
                    const isPlayer1 = challenge.player1_id === currentUser?.id;
                    const opponent = isPlayer1
                      ? challenge.player2
                      : challenge.player1;
                    const opponentName =
                      opponent?.pseudo ||
                      `Joueur #${
                        isPlayer1 ? challenge.player2_id : challenge.player1_id
                      }`;
                    const myScore = isPlayer1
                      ? challenge.player1_score
                      : challenge.player2_score;
                    const opponentScore = isPlayer1
                      ? challenge.player2_score
                      : challenge.player1_score;

                    return (
                      <motion.li
                        key={challenge.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        className={`p-4 rounded-lg shadow-sm border border-[hsl(var(--border))] ${
                          isWinner
                            ? "bg-[hsl(var(--primary))/0.1]"
                            : "bg-[hsl(var(--destructive))/0.1]"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            Duel contre {opponentName} -{" "}
                            {challenge.status === "completed"
                              ? isWinner
                                ? "Victoire"
                                : "Défaite"
                              : challenge.status}
                          </span>
                          <span
                            className={`font-bold ${
                              isWinner
                                ? "text-[hsl(var(--primary))]"
                                : "text-[hsl(var(--destructive))]"
                            }`}
                          >
                            {myScore ?? 0} - {opponentScore ?? 0}
                          </span>
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {new Date(challenge.created_at).toLocaleString()}
                        </p>
                      </motion.li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))] text-center">
                  Aucun duel ou challenge
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
