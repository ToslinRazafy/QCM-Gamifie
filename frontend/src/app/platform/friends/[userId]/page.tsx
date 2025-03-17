"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { User } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import getEcho from "@/lib/echo";
import { URL_IMG_BACKEND } from "@/constant";

export default function ProfilePage() {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        setUserProfile(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        toast.error("Impossible de charger le profil");
      } finally {
        setLoading(false);
      }
    };
    if (isClient && userId) {
      fetchUserProfile();
    }
  }, [isClient, userId]);

  useEffect(() => {
    if (!currentUser || !isClient || !userProfile) return;

    const echo = getEcho();
    if (!echo) {
      console.error("Echo non initialisé pour ProfilePage");
      return;
    }

    const userChannel = echo.private(`friends.user.${currentUser.id}`);

    userChannel.listen(".friend.request.sent", (e) => {
      if (
        e.friendship.friend_id === userProfile.id ||
        e.friendship.user_id === userProfile.id
      ) {
        setUserProfile((prev) =>
          prev ? { ...prev, status: "pending" } : null
        );
      }
    });

    userChannel.listen(".friend.request.responded", (e) => {
      if (
        e.friendship.friend_id === userProfile.id ||
        e.friendship.user_id === userProfile.id
      ) {
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                status: e.response === "accepted" ? "accepted" : "none",
              }
            : null
        );
      }
    });

    return () => {
      userChannel.stopListening(".friend.request.sent");
      userChannel.stopListening(".friend.request.responded");
    };
  }, [currentUser, isClient, userProfile]);

  const handleAddFriend = async () => {
    if (!currentUser || !userProfile) return;
    try {
      await api.post("/friends/request", { friend_id: userProfile.id });
      toast.success("Demande d'ami envoyée !");
    } catch (err) {
      console.error("Erreur lors de l’ajout d’ami:", err);
      toast.error("Erreur lors de l’envoi de la demande");
    }
  };

  const skeletonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const profileVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.3 } },
  };

  if (loading || !isClient) {
    return (
      <motion.div
        className="min-h-screen bg-[hsl(var(--background))] p-6 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={skeletonVariants}
      >
        <div className="max-w-4xl w-full space-y-6">
          <Skeleton className="h-40 w-40 rounded-full mx-auto bg-[hsl(var(--muted))] opacity-50" />
          <Skeleton className="h-10 w-1/2 mx-auto rounded-lg bg-[hsl(var(--muted))] opacity-50" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full rounded-xl bg-[hsl(var(--muted))] opacity-50" />
            <Skeleton className="h-48 w-full rounded-xl bg-[hsl(var(--muted))] opacity-50" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-6 flex items-center justify-center text-[hsl(var(--foreground))]">
        <div className="text-center">
          <p className="text-xl font-semibold">Utilisateur non trouvé</p>
          <Button
            onClick={() => router.push("/platform/friends")}
            className="mt-4 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary),0.8))] text-[hsl(var(--primary-foreground))] rounded-full px-6"
          >
            Retour aux amis
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;
  const isFriend = userProfile.status === "accepted";
  const hasPendingRequest = userProfile.status === "pending";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden relative">
      {/* Fond futuriste */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--muted))/0.2] to-[hsl(var(--background))] opacity-80 z-0" />
      <div className="absolute inset-0 bg-[url('/grid.png')] bg-repeat opacity-10 z-0" />

      <motion.div
        className="relative z-10 container mx-auto max-w-5xl py-12"
        initial="hidden"
        animate="visible"
        variants={profileVariants}
      >
        {/* Header du profil */}
        <div className="relative bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))/0.1] to-transparent opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-[hsl(var(--primary))] shadow-lg transform hover:scale-105 transition-transform duration-300">
                <AvatarImage src={`${URL_IMG_BACKEND}/${userProfile.avatar}`} />
                <AvatarFallback className="text-4xl font-bold bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                  {userProfile.pseudo[0]}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-[hsl(var(--card))] ${
                  userProfile.status === "online"
                    ? "bg-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--muted))]"
                }`}
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[hsl(var(--primary))] tracking-tight drop-shadow-md">
                {userProfile.pseudo}
              </h1>
              <p className="text-lg italic text-[hsl(var(--muted-foreground))] mt-2 max-w-md">
                {userProfile.bio || "Pas de bio pour ce joueur..."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1 rounded-full shadow-sm">
                  {userProfile.league}
                </Badge>
                <Badge className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] px-3 py-1 rounded-full shadow-sm">
                  XP: {userProfile.xp}
                </Badge>
                <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-3 py-1 rounded-full shadow-sm">
                  {userProfile.country}
                </Badge>
              </div>
              {!isOwnProfile && (
                <Button
                  className="mt-6 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary),0.8))] text-[hsl(var(--primary-foreground))] rounded-full px-8 py-2 shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddFriend}
                  disabled={isFriend || hasPendingRequest}
                >
                  {isFriend
                    ? "Ami"
                    : hasPendingRequest
                    ? "En attente"
                    : "Ajouter"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Grille de contenu */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Statistiques */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-4">
                <CardTitle className="text-xl font-bold tracking-wide">
                  Stats de légende
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-4 text-[hsl(var(--foreground))]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Victoires en duel</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {userProfile.duel_wins}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Quizzes créés</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {userProfile.quizzes.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Réponses données</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {userProfile.user_responses.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Challenges gagnés</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {userProfile.won_challenges.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Informations */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-4">
                <CardTitle className="text-xl font-bold tracking-wide">
                  Identité
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-4 text-[hsl(var(--foreground))]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Prénom</span>
                  <span>{userProfile.firstname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Nom</span>
                  <span>{userProfile.lastname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Email</span>
                  <span className="truncate max-w-[200px]">
                    {userProfile.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Amis</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {userProfile.friends.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Badges */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-2"
          >
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-[hsl(var(--secondary))] py-4">
                <CardTitle className="text-xl font-bold text-[hsl(var(--secondary-foreground))] tracking-wide">
                  Trophées ({userProfile.badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userProfile.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {userProfile.badges.map((badge: any, index: number) => (
                      <motion.div
                        key={index}
                        className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-4 py-2 rounded-full shadow-md transform hover:scale-110 transition-all"
                        whileHover={{ rotate: 5 }}
                      >
                        {badge.name || `Trophée #${index}`}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))] text-center">
                    Aucun trophée remporté...
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Publications */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-2"
          >
            <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-[hsl(var(--secondary))] py-4">
                <CardTitle className="text-xl font-bold text-[hsl(var(--secondary-foreground))] tracking-wide">
                  Activité ({userProfile.posts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userProfile.posts.length > 0 ? (
                  <ul className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--primary))] scrollbar-track-[hsl(var(--muted))]">
                    {userProfile.posts.map((post: any, index: number) => (
                      <motion.li
                        key={index}
                        className="bg-[hsl(var(--muted))] p-4 rounded-lg shadow-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted),0.8)] transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <p className="text-[hsl(var(--foreground))]">
                          {post.content || `Post #${index}`}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <span>Likes: {post.likes?.length || 0}</span>
                          <span>
                            Commentaires: {post.comments?.length || 0}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))] text-center">
                    Aucune activité récente
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
