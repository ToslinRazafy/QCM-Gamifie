"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import api from "@/lib/api";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { getSocket, listenToChallenge } from "@/lib/socket";

interface User {
  id: string;
  pseudo: string;
  xp: number;
  status: string;
}

interface CreateChallengeProps {
  userXp: number;
  onChallengeCreated: () => void;
}

export default function CreateChallenge({
  userXp,
  onChallengeCreated,
}: CreateChallengeProps) {
  const { user } = useAuth();
  const [bet, setBet] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [opponentPseudo, setOpponentPseudo] = useState("");
  const [opponentXp, setOpponentXp] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    if (userXp >= 25) fetchUsers();
  }, [userXp]);

  useEffect(() => {
    if (!user || !challengeId) return;

    const token = localStorage.getItem("token") || "";
    const socket = getSocket(token, user.id);

    // Écouter les événements du défi créé
    listenToChallenge(socket, challengeId, user.id, (event, data) => {
      switch (event) {
        case "challenge.accepted":
          toast.success("Défi accepté", {
            description: `${opponentPseudo} a accepté votre défi !`,
          });
          break;
        case "challenge.started":
          // La redirection est gérée dans listenToChallenge
          break;
        case "challenge.declined":
          toast.info("Défi refusé", {
            description: `${opponentPseudo} a refusé votre défi.`,
          });
          resetState("Défi refusé par l'adversaire.");
          break;
        case "challenge.cancelled":
          // Ne devrait pas arriver ici, car seul le créateur peut annuler
          break;
      }
    });

    return () => {
      socket.off("challenge.accepted");
      socket.off("challenge.started");
      socket.off("challenge.declined");
      socket.off("challenge.cancelled");
    };
  }, [challengeId, user, opponentPseudo]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(
        res.data.filter(
          (u: User) => u.id !== user?.id && u.xp >= 25 && u.status === "online"
        )
      );
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de charger les utilisateurs",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bet || !opponentId) {
      toast.error("Erreur", { description: "Veuillez remplir tous les champs" });
      return;
    }

    const betNumber = parseInt(bet);
    const maxBet = opponentXp !== null ? Math.min(userXp, opponentXp) : userXp;
    if (betNumber < 25 || betNumber > maxBet) {
      toast.error("Erreur", { description: `Mise entre 25 et ${maxBet} XP` });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/challenges/invite", {
        opponent_id: opponentId,
        bet: betNumber,
      });
      setChallengeId(res.data.id);
      toast.success("Succès", { description: "Défi envoyé ! En attente de réponse..." });
      onChallengeCreated();
    } catch (error: any) {
      toast.error("Erreur", {
        description:
          error.response?.data?.error || "Erreur lors de la création",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!challengeId) return;
    try {
      await api.post(`/challenges/cancel/${challengeId}`);
      resetState("Défi annulé.");
    } catch (error) {
      toast.error("Erreur", { description: "Erreur lors de l'annulation" });
    }
  };

  const resetState = (message: string) => {
    setChallengeId(null);
    setBet("");
    setOpponentId("");
    setOpponentPseudo("");
    setOpponentXp(null);
    toast.info("Info", { description: message });
    onChallengeCreated();
  };

  const maxBet = opponentXp !== null ? Math.min(userXp, opponentXp) : userXp;

  if (userXp < 25) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Créer un Défi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vous devez avoir au moins 25 XP pour créer un défi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Défi</CardTitle>
      </CardHeader>
      <CardContent>
        {challengeId ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              En attente de {opponentPseudo}...
            </p>
            <p>Mise : {bet} XP</p>
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="opponent">Adversaire</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {opponentPseudo || "Sélectionner..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList>
                      <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                      <CommandGroup>
                        {users.map((userItem) => (
                          <CommandItem
                            key={userItem.id}
                            value={userItem.pseudo}
                            onSelect={() => {
                              setOpponentId(userItem.id);
                              setOpponentPseudo(userItem.pseudo);
                              setOpponentXp(userItem.xp);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                opponentId === userItem.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {userItem.pseudo} ({userItem.xp} XP)
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bet">Mise XP (25-{maxBet})</Label>
              <Input
                type="number"
                id="bet"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                min="25"
                max={maxBet}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Création..." : "Inviter"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}