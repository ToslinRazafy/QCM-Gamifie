"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { URL_IMG_BACKEND } from "@/constant";

interface UserProfile {
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
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user as UserProfile);
    } else {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profile");
      setProfile(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-center py-10">Chargement du profil...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto py-6"
    >
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl font-semibold">
            Profil Administrateur
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hover:bg-[hsl(var(--muted))]"
          >
            <Link href="/admin/settings">Modifier</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 ">
                <AvatarImage
                  src={
                    profile.avatar
                      ? `${URL_IMG_BACKEND}/${profile.avatar}`
                      : undefined
                  }
                  alt="Avatar"
                  className="object-cover"
                />
                <AvatarFallback>
                  {profile.firstname[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--primary))]">
                  {profile.firstname} {profile.lastname}
                </h2>
                <p className="text-[hsl(var(--muted-foreground))]">
                  @{profile.pseudo}
                </p>
                <p className="text-sm text-[hsl(var(--foreground))]">
                  {profile.email}
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Pays
                </Label>
                <p>{profile.country || "Non spécifié"}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Bio
                </Label>
                <p>{profile.bio || "Aucune bio"}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  XP
                </Label>
                <p>{profile.xp}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Ligue
                </Label>
                <p>{profile.league}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Victoires en duel
                </Label>
                <p>{profile.duel_wins}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Rôle
                </Label>
                <p>{profile.role}</p>
              </div>
              <div>
                <Label className="text-[hsl(var(--muted-foreground))]">
                  Statut
                </Label>
                <p
                  className={
                    profile.is_active ? "text-green-500" : "text-red-500"
                  }
                >
                  {profile.is_active ? "Actif" : "Inactif"} - {profile.status}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
