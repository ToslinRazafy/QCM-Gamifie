"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useProtectedRoute(["ADMIN"]);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    total_quizzes: 0,
    total_challenges: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard");
        setStats(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
      }
    };
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated]);

  const pieData = [
    { name: "Utilisateurs actifs", value: stats.active_users },
    {
      name: "Utilisateurs inactifs",
      value: stats.total_users - stats.active_users,
    },
  ];

  const lineData = [
    { name: "Jan", quizzes: 10, challenges: 5 },
    { name: "Feb", quizzes: 15, challenges: 8 },
    {
      name: "Mar",
      quizzes: stats.total_quizzes,
      challenges: stats.total_challenges,
    },
  ];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  if (isLoading) return <div className="text-center">Chargement...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilisateurs totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
              {stats.total_users}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilisateurs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
              {stats.active_users}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quizzes totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
              {stats.total_quizzes}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Challenges totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
              {stats.total_challenges}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Répartition des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Évolution des activités</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="quizzes"
                  stroke="hsl(var(--chart-3))"
                />
                <Line
                  type="monotone"
                  dataKey="challenges"
                  stroke="hsl(var(--chart-4))"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
