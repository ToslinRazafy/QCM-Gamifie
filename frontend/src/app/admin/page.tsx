"use client"

import { notFound } from "next/navigation";
import Dashboard from "./dashboard/page";
import AddQuiz from "./quizzes/page";
import Users from "./users/page";
import Categories from "./categories/page";
import Settings from "./settings/page";
import { useAuth } from "@/components/AuthProvider";
import Loader from "@/components/Loader"; // Assurez-vous que le chemin est correct

export default function AdminPage({ params }: { params: { slug: string[] } }) {
  const [slug] = params.slug || [];
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <p>Accès refusé</p>;

  switch (slug) {
    case undefined:
    case "dashboard":
      return <Dashboard />;
    case "quizzes":
      return <AddQuiz />;
    case "users":
      return <Users />;
    case "categories":
      return <Categories />;
    case "settings":
      return <Settings />;
    default:
      notFound();
  }
}
