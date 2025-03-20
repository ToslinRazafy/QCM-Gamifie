"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ExamenHistoriques = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      fetchResults();
    } else {
      setResults([]);
    }
  }, [user?.id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      console.log("Fetching from /examens/results");
      const res = await api.get("/examens/results");
      if (!Array.isArray(res.data)) {
        throw new Error("Réponse invalide du serveur");
      }
      setResults(res.data);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors du chargement des résultats"
      );
      console.error("Erreur API:", error.response?.data || error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et paginer les résultats
  const filteredResults = useMemo(() => {
    return results.filter(
      (result) =>
        result.examen?.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        result.score?.toString().includes(searchTerm)
    );
  }, [results, searchTerm]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 space-y-8"
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Mes Résultats des Examens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher par titre ou score..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
              }}
              className="max-w-sm"
            />
            <Button onClick={fetchResults}>Rafraîchir</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Examen
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Utilisateurs
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Score
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Date de soumission
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-4 text-gray-500"
                  >
                    {searchTerm
                      ? "Aucun résultat correspondant"
                      : "Aucun résultat trouvé"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResults.map((result) => (
                  <motion.tr
                    key={result.id}
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-4">
                      {result.examen?.title || "Examen inconnu"}
                    </TableCell>
                    <TableCell className="py-4">
                      {result.user.firtsname} { result.user.lastname || "" }
                    </TableCell>
                    <TableCell className="py-4">
                      {result.score !== undefined
                        ? `${result.score}/20`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="py-4">
                      {result.submitted_at
                        ? new Date(result.submitted_at).toLocaleString("fr-FR")
                        : "Non soumis"}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>

          {/* Contrôles de pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                {Math.min(currentPage * itemsPerPage, filteredResults.length)}{" "}
                sur {filteredResults.length} résultats
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="self-center text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExamenHistoriques;
