"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExamenList() {
  const [examens, setExamens] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchExamens();
  }, []);

  const fetchExamens = async () => {
    try {
      const res = await api.get("/examens");
      const examensArray = Object.values(res.data);
      console.log("Tableau converti :", examensArray);
      const publishedExamens = examensArray.filter(
        (examen: any) => examen.status === "PUBLISHED"
      );
      setExamens(publishedExamens);
    } catch (error) {
      console.error("Erreur :", error);
      setExamens([]);
    }
  };

  const filteredExamens = examens.filter(
    (examen: any) =>
      examen.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === "all" || examen.category === category)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Examens Disponibles</h1>
      <div className="flex gap-4">
        <Input
          placeholder="Rechercher un examen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="math">Mathématiques</SelectItem>
            <SelectItem value="science">Sciences</SelectItem>
            {/* Ajouter d'autres catégories selon vos besoins */}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Durée (s)</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExamens.map((examen: any) => (
            <TableRow key={examen.id}>
              <TableCell>{examen.title}</TableCell>
              <TableCell>{examen.timer}</TableCell>
              <TableCell>
                <Button
                  onClick={() => router.push(`/examen/${examen.id}/play`)}
                >
                  Démarrer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
