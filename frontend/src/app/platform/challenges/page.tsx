"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import api from "@/lib/api";
import { getSocket, registerUser, listenToChallenge } from "@/lib/socket";
import ChallengeList from "@/components/ChallengeList";
import CreateChallenge from "@/components/CreateChallenge";
import { toast } from "sonner";

interface Player {
  id: string; // UUID
  pseudo: string;
}

interface Quiz {
  id: number;
  title: string;
}

interface Challenge {
  id: string; // UUID
  player1: Player;
  player2_id: string; // UUID
  player1_bet: number;
  player2_bet: number;
  status: "pending" | "active" | "completed";
  quizzes: Quiz[];
}

export default function LobbyPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Début de fetchChallenges pour user:", user.id);
      console.log("Appel API: /lobby");
      const pendingRes = await api.get("/lobby");
      console.log("Réponse /lobby:", pendingRes.data);

      console.log("Appel API: /challenges/active");
      const activeRes = await api.get("/challenges/active");
      console.log("Réponse /challenges/active:", activeRes.data);

      const pending = Array.isArray(pendingRes.data.pending)
        ? pendingRes.data.pending
        : [];
      const filteredPending = pending.filter(
        (challenge: Challenge) =>
          challenge &&
          challenge.player2_id === user.id &&
          challenge.player1?.id !== user.id
      );

      const active = Array.isArray(activeRes.data.active)
        ? activeRes.data.active
        : [];

      setPendingChallenges(filteredPending);
      setActiveChallenges(active);
      console.log("Défis chargés:", { pending: filteredPending, active });
    } catch (error: any) {
      console.error(
        "Erreur lors du chargement des défis:",
        error.response?.data || error.message
      );
      console.error("URL appelée:", error.config?.url);
      toast.error("Impossible de charger les défis");
      setPendingChallenges([]);
      setActiveChallenges([]);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      window.location.href = "/login";
      return;
    }
    if (!user) return;

    fetchChallenges();

    const token = localStorage.getItem("token") || "";
    const socket = getSocket(token, user.id);

    registerUser(socket, user.id, "challenges");

    socket.on("connect", () => {
      console.log("Socket connecté avec ID:", socket.id);
      setIsSocketConnected(true);
      socket.emit("join", { room: `private-challenges.user.${user.id}` });
      pendingChallenges.forEach((challenge) =>
        socket.emit("join", { room: `private-challenges.${challenge.id}` })
      );
      activeChallenges.forEach((challenge) =>
        socket.emit("join", { room: `private-challenges.${challenge.id}` })
      );
    });

    socket.on("disconnect", () => {
      console.log("Socket déconnecté");
      setIsSocketConnected(false);
    });

    const handleSocketEvent = (event: string, data: any) => {
      switch (event) {
        case "challenge.created":
          if (
            data.challenge.player2_id === user.id &&
            data.challenge.player1.id !== user.id
          ) {
            setPendingChallenges((prev) => {
              if (!prev.some((c) => c.id === data.challenge.id)) {
                toast.info("Nouveau défi", {
                  description: `${data.challenge.player1.pseudo} vous a défié !`,
                });
                listenToChallenge(
                  socket,
                  data.challenge.id,
                  user.id,
                  handleSocketEvent
                );
                return [...prev, data.challenge];
              }
              return prev;
            });
          }
          break;

        case "challenge.accepted":
          if (
            data.challenge.player1.id === user.id ||
            data.challenge.player2_id === user.id
          ) {
            setPendingChallenges((prev) =>
              prev.filter((c) => c.id !== data.challenge.id)
            );
            setActiveChallenges((prev) => {
              if (!prev.some((c) => c.id === data.challenge.id)) {
                listenToChallenge(
                  socket,
                  data.challenge.id,
                  user.id,
                  handleSocketEvent
                );
                return [...prev, data.challenge];
              }
              return prev;
            });
            toast.success("Défi accepté", { description: "Préparation..." });
          }
          break;

        case "challenge.declined":
          if (data.challenge.player1.id === user.id) {
            setPendingChallenges((prev) =>
              prev.filter((c) => c.id !== data.challenge.id)
            );
            toast.info("Défi refusé", {
              description: `${data.challenge.player2_id} a refusé votre défi.`,
            });
          } else if (data.challenge.player2_id === user.id) {
            setPendingChallenges((prev) =>
              prev.filter((c) => c.id !== data.challenge.id)
            );
          }
          break;

        case "challenge.cancelled":
          if (data.challenge.player1.id === user.id) {
            setPendingChallenges((prev) =>
              prev.filter((c) => c.id !== data.challenge.id)
            );
            toast.info("Défi annulé", {
              description: "Votre défi a été annulé.",
            });
          } else if (data.challenge.player2_id === user.id) {
            setPendingChallenges((prev) =>
              prev.filter((c) => c.id !== data.challenge.id)
            );
            toast.info("Défi annulé", {
              description: `${data.challenge.player1.pseudo} a annulé le défi.`,
            });
          }
          break;
      }
    };

    socket.on("challenge.created", (data) =>
      handleSocketEvent("challenge.created", data)
    );
    socket.on("challenge.accepted", (data) =>
      handleSocketEvent("challenge.accepted", data)
    );
    socket.on("challenge.declined", (data) =>
      handleSocketEvent("challenge.declined", data)
    );
    socket.on("challenge.cancelled", (data) =>
      handleSocketEvent("challenge.cancelled", data)
    );

    pendingChallenges.forEach((challenge) =>
      listenToChallenge(socket, challenge.id, user.id, handleSocketEvent)
    );
    activeChallenges.forEach((challenge) =>
      listenToChallenge(socket, challenge.id, user.id, handleSocketEvent)
    );

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("challenge.created");
      socket.off("challenge.accepted");
      socket.off("challenge.declined");
      socket.off("challenge.cancelled");
    };
  }, [
    user,
    isAuthenticated,
    isLoading,
    fetchChallenges,
    pendingChallenges,
    activeChallenges,
  ]);

  if (isLoading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Lobby des Duels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Vos XP: {user?.xp || 0}
                </span>
              </div>
              <ChallengeList
                challenges={pendingChallenges}
                activeChallenges={activeChallenges}
                onChallengeUpdated={fetchChallenges}
                userId={user.id}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <CreateChallenge
          userXp={user?.xp || 0}
          onChallengeCreated={fetchChallenges}
        />
      </div>
    </div>
  );
}
