"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";

interface Challenge {
  id: string;
  player1: { id: string; pseudo: string };
  player2_id?: string;
  quizzes: { title: string }[];
  player1_bet: number;
  player2_bet?: number;
  status: string;
}

interface ChallengeListProps {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  onChallengeUpdated: () => void;
  userId: string;
}

export default function ChallengeList({
  challenges,
  activeChallenges,
  onChallengeUpdated,
  userId,
}: ChallengeListProps) {
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>(challenges);

  useEffect(() => {
    setPendingChallenges(challenges);
  }, [challenges]);

  const handleAccept = async (challengeId: string) => {
    try {
      await api.post(`/challenges/accept/${challengeId}`);
      onChallengeUpdated();
    } catch (error: any) {
      toast.error("Erreur", {
        description:
          error.response?.data?.error || "Erreur lors de l'acceptation",
      });
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      await api.post(`/challenges/decline/${challengeId}`);
      setPendingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      onChallengeUpdated();
    } catch (error) {
      toast.error("Erreur", { description: "Erreur lors du refus" });
    }
  };

  if (pendingChallenges.length === 0 && activeChallenges.length === 0) {
    return (
      <CardContent>
        <p className="text-muted-foreground text-center">Aucun défi en cours</p>
      </CardContent>
    );
  }

  return (
    <div className="space-y-4">
      {pendingChallenges.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Défis en attente</h3>
          {pendingChallenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{challenge.player1.pseudo}</p>
                  <p className="text-sm text-muted-foreground">
                    Quiz: {challenge.quizzes.map((q) => q.title).join(", ")}
                  </p>
                  <p className="text-sm">Mise: {challenge.player1_bet} XP</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleAccept(challenge.id)}>
                    Accepter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecline(challenge.id)}
                  >
                    Décliner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
      {activeChallenges.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Défis actifs</h3>
          {activeChallenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{challenge.player1.pseudo}</p>
                  <p className="text-sm text-muted-foreground">
                    Quiz: {challenge.quizzes.map((q) => q.title).join(", ")}
                  </p>
                  <p className="text-sm">Mises: {challenge.player1_bet} XP</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = `/platform/challenges/${challenge.id}/play`)
                  }
                >
                  Rejoindre
                </Button>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}