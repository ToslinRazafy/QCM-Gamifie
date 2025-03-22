"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { RadialBarChart, RadialBar } from "recharts";
import api from "@/lib/api"
import { useAuth } from "@/components/AuthProvider";


export default function ExamenDashboard() {
  const [examens, setExamens] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      fetchExamens();
      fetchResults();
    }
  }, [user]);

  const fetchExamens = async () => {
    try {
      const res = await api.get("/examens");
      setExamens(Object.values(res.data));
    } catch (error) {
      console.error("Erreur lors de la récupération des examens :", error);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await api.get("/examens/results");
      setResults(
        Object.values(res.data).filter((r: any) => r.user_id === user?.id)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des résultats :", error);
    }
  };

  const totalExamens = examens.length;
  const totalAttempts = results.length;
  const averageScore =
    totalAttempts > 0
      ? (results.reduce((sum, r) => sum + r.score, 0) / totalAttempts).toFixed(
          1
        )
      : 0;
  const successRate =
    totalAttempts > 0
      ? (
          (results.filter((r) => r.score >= 10).length / totalAttempts) *
          100
        ).toFixed(1)
      : 0;
  const highestScore =
    totalAttempts > 0 ? Math.max(...results.map((r) => r.score)) : 0;
  const lowestScore =
    totalAttempts > 0 ? Math.min(...results.map((r) => r.score)) : 0;
  const examsPassed = results.filter((r) => r.score >= 10).length;
  const examsFailed = results.filter((r) => r.score < 10).length;

  const pieData = [
    { name: "Réussis", value: examsPassed },
    { name: "Échoués", value: examsFailed },
  ];

  console.log(pieData);

  const radialData = [
    { name: "Score Moyen", value: parseFloat(averageScore), fill: "#f97316" },
    { name: "Max", value: 20, fill: "#e5e7eb" },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  if (!isMounted) {
    return <div>Chargement...</div>; // Optional loading state
  }

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">
        Tableau de bord des Examens
      </h1>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total des Examens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{totalExamens}</p>
            <p className="text-sm text-gray-600 mt-2">
              Examens disponibles à passer
            </p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/examen/list">Voir les examens</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Examens Réalisés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">
              {totalAttempts}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Examens que vous avez passés
            </p>
            <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700">
              <Link href="/examen/my-results">Voir mes résultats</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taux de Réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{successRate}%</p>
            <p className="text-sm text-gray-600 mt-2">
              Pourcentage de réussites (≥ 10/20)
            </p>
            <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
              <Link href="/examen/results">Voir tous les résultats</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">
              {averageScore}/20
            </p>
            <p className="text-sm text-gray-600 mt-2">Moyenne de vos scores</p>
            {totalAttempts > 0 && (
              <Badge variant="outline" className="mt-2">
                Basé sur {totalAttempts} tentative(s)
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Examens Réussis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{examsPassed}</p>
            <p className="text-sm text-gray-600 mt-2">
              Examens avec moyenne (≥ 10/20)
            </p>
            {totalAttempts > 0 && (
              <Badge variant="outline" className="mt-2">
                {((examsPassed / totalAttempts) * 100).toFixed(1)}% des
                tentatives
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Examens Échoués</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">{examsFailed}</p>
            <p className="text-sm text-gray-600 mt-2">
              Examens sans moyenne (&lt; 10/20)
            </p>
            {totalAttempts > 0 && (
              <Badge variant="outline" className="mt-2">
                {((examsFailed / totalAttempts) * 100).toFixed(1)}% des
                tentatives
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meilleur Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {highestScore}/20
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Votre meilleur résultat
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pire Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">{lowestScore}/20</p>
            <p className="text-sm text-gray-600 mt-2">Votre pire résultat</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Résultats</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <PieChart width={300} height={300}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
            <p className="text-sm text-gray-600 mt-2">
              Réussites vs Échecs sur {totalAttempts} tentative(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Score Moyen Global</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RadialBarChart
              width={300}
              height={300}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              barSize={20}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar minAngle={15} background clockWise dataKey="value" />
              <Tooltip />
            </RadialBarChart>
            <p className="text-sm text-gray-600 mt-2">
              Score moyen de {averageScore}/20
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
