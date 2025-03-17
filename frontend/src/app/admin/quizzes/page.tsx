"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash, Plus, Eye, Edit } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import AddQuiz from "@/components/AddQuiz";

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quizzes");
      setQuizzes(res.data);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async () => {
    setLoading(true);
    try {
      await api.delete(`/quizzes/${quizToDelete}`);
      setQuizzes(quizzes.filter((q) => q.id !== quizToDelete));
      setIsDeleteDialogOpen(false);
      setQuizToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setQuizToEdit(quiz);
    setShowForm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestion des Quizzes</h1>
        <Button
          onClick={() => {
            setQuizToEdit(null);
            setShowForm(!showForm);
          }}
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-[hsl(var(--muted))]"
        >
          {showForm ? "Liste" : "Ajouter"}
          {showForm ? null : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {showForm ? (
        <AddQuiz onQuizAdded={fetchQuizzes} quizToEdit={quizToEdit} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Créateur</TableHead>
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
              quizzes.map((quiz) => (
                <motion.tr
                  key={quiz.id}
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TableCell>{quiz.title}</TableCell>
                  <TableCell>{quiz.category?.name || "N/A"}</TableCell>
                  <TableCell>{quiz.niveau}</TableCell>
                  <TableCell>{quiz.questions?.length || 0}</TableCell>
                  <TableCell>{quiz.user?.pseudo || "N/A"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedQuiz(quiz)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditQuiz(quiz)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setQuizToDelete(quiz.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="h-4 w-4 text-[hsl(var(--destructive))]" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <p>Êtes-vous sûr de vouloir supprimer ce quiz ?</p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={deleteQuiz}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedQuiz && (
        <Dialog
          open={!!selectedQuiz}
          onOpenChange={() => setSelectedQuiz(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedQuiz.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Description</p>
                <p>{selectedQuiz.description || "Aucune description"}</p>
              </div>
              <div>
                <p className="font-medium">Catégorie</p>
                <p>{selectedQuiz.category?.name || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Niveau</p>
                <p>{selectedQuiz.niveau}</p>
              </div>
              <div>
                <p className="font-medium">Créateur</p>
                <p>{selectedQuiz.user?.pseudo || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Questions</p>
                {selectedQuiz.questions?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Texte</TableHead>
                        <TableHead>Temps limite</TableHead>
                        <TableHead>Réponses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuiz.questions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell>{q.text}</TableCell>
                          <TableCell>{q.time_limit || "N/A"}</TableCell>
                          <TableCell>{q.answers?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Aucune question</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedQuiz(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
