"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { User } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { getSocket, registerUser } from "@/lib/socket";
import { URL_IMG_BACKEND } from "@/constant";

interface ExtendedUser extends User {
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "accepted";
  status: "online" | "offline";
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted";
  user: User;
  friend: User;
}

export default function FriendPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [search, setSearch] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "suggestions" | "friends" | "requests"
  >("suggestions");
  const [isSocketConnectedState, setIsSocketConnectedState] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const fetchUsersAndFriends = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, friendsRes] = await Promise.all([
        api.get("/users"),
        api.get("/friends"),
      ]);
      const allUsers = usersRes.data
        .filter((u: User) => u.role === "USER" && u.id !== currentUser?.id)
        .map((u: ExtendedUser) => ({
          ...u,
          friendshipStatus: getFriendshipStatus(u, friendsRes.data),
          status: u.status || "offline",
        }));
      setUsers(allUsers);
      console.log("Amis chargés:", friendsRes.data);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getFriendshipStatus = useCallback(
    (user: User, friends: Friendship[]): ExtendedUser["friendshipStatus"] => {
      const friendship = friends.find(
        (f) => f.user_id === user.id || f.friend_id === user.id
      );
      if (!friendship) return "none";
      if (friendship.status === "accepted") return "accepted";
      return friendship.user_id === currentUser?.id
        ? "pending_sent"
        : "pending_received";
    },
    [currentUser]
  );

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchUsersAndFriends();

    const token = localStorage.getItem("token") || "";
    const socket = getSocket(token, currentUser.id);

    registerUser(socket, currentUser.id, "friends");

    socket.on("connect", () => {
      console.log("Socket connecté avec ID:", socket.id);
      setIsSocketConnectedState(true);
      socket.emit("join", { room: `private-friends.${currentUser.id}` });
      socket.emit("join", { room: "public-user-status" });
    });

    socket.on("disconnect", () => {
      console.log("Socket déconnecté");
      setIsSocketConnectedState(false);
    });

    socket.on("friend.request.sent", (data: { friendship: Friendship }) => {
      console.log("Événement friend.request.sent reçu:", data);
      setUsers((prev) => {
        const updatedUsers = [...prev];
        const friendIndex = updatedUsers.findIndex(
          (u) => u.id === data.friendship.friend_id
        );
        const userIndex = updatedUsers.findIndex(
          (u) => u.id === data.friendship.user_id
        );

        // Si currentUser est le destinataire (friend_id)
        if (data.friendship.friend_id === currentUser.id) {
          // Mettre à jour ou ajouter l'émetteur (user_id) avec "pending_received"
          if (userIndex !== -1) {
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              friendshipStatus: "pending_received",
            };
          } else {
            updatedUsers.push({
              ...data.friendship.user,
              friendshipStatus: "pending_received",
              status: data.friendship.user.status || "offline",
            });
          }
        }

        // Si currentUser est l'émetteur (user_id)
        if (data.friendship.user_id === currentUser.id) {
          // Mettre à jour ou ajouter le destinataire (friend_id) avec "pending_sent"
          if (friendIndex !== -1) {
            updatedUsers[friendIndex] = {
              ...updatedUsers[friendIndex],
              friendshipStatus: "pending_sent",
            };
          } else {
            updatedUsers.push({
              ...data.friendship.friend,
              friendshipStatus: "pending_sent",
              status: data.friendship.friend.status || "offline",
            });
          }
        }

        return updatedUsers;
      });

      if (data.friendship.friend_id === currentUser.id) {
        toast.info(
          `${data.friendship.user.pseudo} vous a envoyé une demande d'ami !`
        );
      }
    });

    socket.on(
      "friend.request.responded",
      (data: { response: string; friendship: Friendship }) => {
        console.log("Événement friend.request.responded reçu:", data);
        setUsers((prev) =>
          prev.map((u) => {
            if (
              u.id === data.friendship.friend_id ||
              u.id === data.friendship.user_id
            ) {
              return {
                ...u,
                friendshipStatus:
                  data.response === "accepted" ? "accepted" : "none",
              };
            }
            return u;
          })
        );

        if (
          data.friendship.user_id === currentUser.id &&
          data.response === "accepted"
        ) {
          toast.success(
            `${data.friendship.friend.pseudo} a accepté votre demande !`
          );
        } else if (
          data.friendship.friend_id === currentUser.id &&
          data.response === "accepted"
        ) {
          toast.success(
            `Vous êtes maintenant ami avec ${data.friendship.user.pseudo} !`
          );
        } else if (
          data.friendship.user_id === currentUser.id &&
          data.response === "rejected"
        ) {
          toast.info(
            `${data.friendship.friend.pseudo} a refusé votre demande.`
          );
        } else if (
          data.friendship.user_id === currentUser.id &&
          data.response === "cancelled"
        ) {
          toast.info(
            `Vous avez annulé votre demande à ${data.friendship.friend.pseudo}.`
          );
        } else if (data.response === "removed") {
          if (data.friendship.user_id === currentUser.id) {
            toast.info(
              `Vous avez retiré ${data.friendship.friend.pseudo} de vos amis.`
            );
          } else if (data.friendship.friend_id === currentUser.id) {
            toast.info(
              `${data.friendship.user.pseudo} vous a retiré de ses amis.`
            );
          }
        }
      }
    );

    socket.on(
      "friend.request.cancelled",
      (data: { friendship: Friendship }) => {
        console.log("Événement friend.request.cancelled reçu:", data);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === data.friendship.friend_id ||
            u.id === data.friendship.user_id
              ? { ...u, friendshipStatus: "none" }
              : u
          )
        );
        if (data.friendship.friend_id === currentUser.id) {
          toast.info(
            `${data.friendship.user.pseudo} a annulé sa demande d'ami.`
          );
        }
      }
    );

    socket.on(
      "user.status.changed",
      (data: { user_id: string; status: "online" | "offline" }) => {
        console.log("Événement user.status.changed reçu:", data);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === data.user_id ? { ...u, status: data.status } : u
          )
        );
      }
    );

    return () => {
      socket.off("friend.request.sent");
      socket.off("friend.request.responded");
      socket.off("friend.request.cancelled");
      socket.off("user.status.changed");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [currentUser, fetchUsersAndFriends, getFriendshipStatus]);

  const handleAddFriend = async (friendId: string) => {
    try {
      await api.post("/friends/request", { friend_id: friendId });
      toast.success("Demande d'ami envoyée !");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === friendId ? { ...u, friendshipStatus: "pending_sent" } : u
        )
      );
    } catch (err) {
      console.error("Erreur lors de l’ajout d’ami:", err);
      toast.error("Erreur lors de l’envoi de la demande");
    }
  };

  const handleCancelFriend = async (friendId: string) => {
    try {
      await api.post(`/friends/cancel/${friendId}`);
      toast.success("Demande d'ami annulée !");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === friendId ? { ...u, friendshipStatus: "none" } : u
        )
      );
    } catch (err) {
      console.error("Erreur lors de l’annulation de l’ami:", err);
      toast.error("Erreur lors de l’annulation");
    }
  };

  const handleAcceptFriend = async (friendId: string) => {
    try {
      await api.post(`/friends/accept/${friendId}`);
      toast.success("Demande d'ami acceptée !");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === friendId ? { ...u, friendshipStatus: "accepted" } : u
        )
      );
    } catch (err) {
      console.error("Erreur lors de l’acceptation de l’ami:", err);
      toast.error("Erreur lors de l’acceptation");
      if (err.response?.status === 404) {
        toast.warning("Demande non trouvée, rechargement des données...");
        fetchUsersAndFriends();
      }
    }
  };

  const handleRejectFriend = async (friendId: string) => {
    try {
      await api.post(`/friends/reject/${friendId}`);
      toast.success("Demande d'ami rejetée");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === friendId ? { ...u, friendshipStatus: "none" } : u
        )
      );
    } catch (err) {
      console.error("Erreur lors du rejet de l’ami:", err);
      toast.error("Erreur lors du rejet");
      if (err.response?.status === 404) {
        toast.warning("Demande non trouvée, rechargement des données...");
        fetchUsersAndFriends();
      }
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await api.post(`/friends/remove/${friendId}`);
      toast.success("Ami retiré !");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === friendId ? { ...u, friendshipStatus: "none" } : u
        )
      );
    } catch (err) {
      console.error("Erreur lors du retrait de l’ami:", err);
      toast.error("Erreur lors du retrait de l’ami");
    }
  };

  const handleVisitProfile = (userId: string) => {
    router.push(`/platform/friends/${userId}`);
  };

  const handleActiveTab = (value: "suggestions" | "friends" | "requests") => {
    setActiveTab(value);
  };

  const friends = users.filter((u) => u.friendshipStatus === "accepted");
  const suggestions = users.filter(
    (u) => u.friendshipStatus === "none" || u.friendshipStatus === "pending_sent"
  );
  const requests = users.filter((u) => u.friendshipStatus === "pending_received");

  const filteredUsers = (
    activeTab === "friends"
      ? friends
      : activeTab === "requests"
      ? requests
      : suggestions
  ).filter((user) => {
    const matchesSearch = user.pseudo
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCountry =
      countryFilter === "all" || user.country === countryFilter;
    const matchesLeague =
      leagueFilter === "all" || user.league === leagueFilter;
    return matchesSearch && matchesCountry && matchesLeague;
  });

  const allUsersWithCurrent = currentUser ? [...users, currentUser] : users;
  const countries = [
    "all",
    ...new Set(allUsersWithCurrent.map((u) => u.country).filter(Boolean)),
  ];
  const leagues = [
    "all",
    ...new Set(allUsersWithCurrent.map((u) => u.league).filter(Boolean)),
  ];

  const skeletonVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
  };

  const tabVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const filterVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.4 } },
  };

  if (loading) {
    return (
      <motion.div
        className="min-h-screen p-6"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={skeletonVariants}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-md" />
            ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <motion.div
        className="flex justify-between items-center gap-4"
        variants={tabVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex gap-4">
          <Button
            variant={activeTab === "suggestions" ? "default" : "outline"}
            onClick={() => handleActiveTab("suggestions")}
          >
            Suggestions
          </Button>
          <Button
            variant={activeTab === "friends" ? "default" : "outline"}
            onClick={() => handleActiveTab("friends")}
          >
            Amis ({friends.length})
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => handleActiveTab("requests")}
          >
            Demandes ({requests.length})
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="flex flex-col justify-end gap-4 md:flex-row md:items-center"
        variants={filterVariants}
        initial="hidden"
        animate="visible"
      >
        <Input
          placeholder="Rechercher par pseudo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country === "all" ? "Tous les pays" : country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ligue" />
          </SelectTrigger>
          <SelectContent>
            {leagues.map((league) => (
              <SelectItem key={league} value={league}>
                {league === "all" ? "Toutes les ligues" : league}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <AnimatePresence>
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleVisitProfile(user.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={`${URL_IMG_BACKEND}/${user.avatar}`}
                          />
                          <AvatarFallback>{user.firstname[0]}</AvatarFallback>
                        </Avatar>
                        {user.status === "online" && (
                          <span className="absolute top-0 right-0 w-3 h-3 bg-[hsl(var(--primary))] rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{user.pseudo}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {user.country}
                        </p>
                        <p className="text-sm">
                          {user.status === "online" ? "En ligne" : "Hors ligne"}
                        </p>
                        <p className="text-sm">Ligue: {user.league}</p>
                        <p className="text-sm">XP: {user.xp}</p>
                        <p className="text-sm">Victoires: {user.duel_wins}</p>
                      </div>
                    </div>
                    {activeTab === "suggestions" && (
                      user.friendshipStatus === "none" ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend(user.id);
                          }}
                          variant="default"
                        >
                          Ajouter
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelFriend(user.id);
                          }}
                          variant="destructive"
                        >
                          Annuler
                        </Button>
                      )
                    )}
                    {activeTab === "requests" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptFriend(user.id);
                          }}
                        >
                          Accepter
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectFriend(user.id);
                          }}
                        >
                          Rejeter
                        </Button>
                      </div>
                    )}
                    {activeTab === "friends" && (
                      <Button
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(user.id);
                        }}
                      >
                        Retirer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-6"
            >
              <p className="text-[hsl(var(--muted-foreground))]">
                Aucun{" "}
                {activeTab === "suggestions"
                  ? "suggestion"
                  : activeTab === "requests"
                  ? "demande"
                  : "ami"}{" "}
                correspondant aux critères.
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}