"use client";

import { useEffect, useState } from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

interface Quiz {
  id: number;
  title: string;
  niveau: string;
  description: string | null;
  category: { name: string };
}

export default function QuizzesPage() {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDificult, setSelectedDificult] = useState("all");

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterQuizzes();
  }, [searchTerm, selectedCategory, selectedDificult, quizzes]);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/quizzes");
      setQuizzes(response.data);
      setFilteredQuizzes(response.data);
    } catch (error) {
      toast("Erreur", {
        description: "Impossible de charger les quizzes",
      });
    }
  };

  const filterQuizzes = () => {
    let result = [...quizzes];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((quiz) => quiz.category.name === selectedCategory);
    }

    if(selectedDificult !== "all"){
      result = result.filter((quiz) => quiz.niveau === selectedDificult);
    }

    setFilteredQuizzes(result);
  };

  // Get unique categories for the filter
  const categories = [
    "all",
    ...new Set(quizzes.map((quiz) => quiz.category.name)),
  ];

  const dificults = [
    "all",
    ...new Set(quizzes.map((quiz) => quiz.niveau)),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-[hsl(var(--foreground))]">
        Quizzes Disponibles
      </h1>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col justify-end gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher un quiz..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "Toutes les catégories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDificult} onValueChange={setSelectedDificult}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {dificults.map((dificult) => (
              <SelectItem key={dificult} value={dificult}>
                {dificult === "all" ? "Toutes les niveau" : dificult}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {quiz.description || "Pas de description"}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Niveau de dificulté: {quiz.niveau }
              </p>
              <p className="text-sm mb-4">Catégorie: {quiz.category.name}</p>
              <Link href={`/platform/quiz/${quiz.id}`}>
                <Button>Jouer</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
