"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.filter((u) => u.role === "USER"));
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.patch(`/users/${id}/toggle-active`, { is_active: !isActive });
      setUsers(
        users.map((u) => (u.id === id ? { ...u, is_active: !isActive } : u))
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const deleteUser = async (id) => {
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(users.filter((u) => u.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-semibold mb-4">Gestion des Utilisateurs</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>XP</TableHead>
            <TableHead>Ligue</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <motion.tr
                key={user.id}
                className={`${
                  !user.is_active && "opacity-60 bg-[hsl(var(--muted))]"
                }`}
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TableCell>{user.pseudo}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.xp}</TableCell>
                <TableCell>{user.league}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={() =>
                      toggleActive(user.id, user.is_active)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteUser(user.id)}
                  >
                    <Trash className="h-4 w-4 text-[hsl(var(--destructive))]" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
