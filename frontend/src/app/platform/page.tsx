"use client";

import { useEffect, useState } from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  category: { name: string };
}

export default function QuizzesPage() {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated]);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/quizzes");
      setQuizzes(response.data);
    } catch (error) {
      toast("Erruer", {
        description: "Impossible de charger les quizzes"
      });
    }
  };

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {quiz.description || "Pas de description"}
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
