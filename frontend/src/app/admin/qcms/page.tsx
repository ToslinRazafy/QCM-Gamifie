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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";

const generateDefaultQuestions = () => {
  return Array(5)
    .fill(null)
    .map(() => ({
      text: "",
      type: "MULTIPLE_CHOICE",
      answers: Array(3)
        .fill(null)
        .map(() => ({ text: "", is_correct: false })),
    }));
};

export default function Qcms() {
  const [qcms, setQcms] = useState([]);
  const [filteredQcms, setFilteredQcms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShowDialogOpen, setIsShowDialogOpen] = useState(false);
  const [qcmToDelete, setQcmToDelete] = useState(null);
  const [selectedQcm, setSelectedQcm] = useState(null);
  const [form, setForm] = useState({
    id: null,
    title: "",
    category_qcm_id: "",
    description: "",
    questions: generateDefaultQuestions(),
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchQcms();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = qcms.filter(
      (qcm) =>
        qcm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qcm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qcm.category_qcm?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQcms(filtered);
  }, [searchTerm, qcms]);

  const fetchQcms = async () => {
    setLoading(true);
    try {
      const res = await api.get("/qcms");
      setQcms(res.data);
      setFilteredQcms(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des QCM");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/category-qcms");
      setCategories(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories");
    }
  };

  const createCategory = async () => {
    if (!newCategory.name) {
      toast.error("Le nom de la catégorie est requis");
      return null;
    }
    try {
      const res = await api.post("/category-qcms", newCategory);
      await fetchCategories();
      toast.success("Catégorie créée avec succès");
      return res.data.id;
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors.name) {
          toast.error("Une catégorie avec ce nom existe déjà");
        } else {
          toast.error(
            "Erreur de validation lors de la création de la catégorie"
          );
        }
      } else {
        toast.error("Erreur lors de la création de la catégorie");
      }
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Le titre est requis");
      return;
    }
    if (!form.category_qcm_id && !isNewCategory) {
      toast.error("Veuillez sélectionner ou créer une catégorie");
      return;
    }
    if (form.questions.some((q) => !q.text || q.answers.some((a) => !a.text))) {
      toast.error("Toutes les questions et réponses doivent être remplies");
      return;
    }

    setLoading(true);
    let categoryId = form.category_qcm_id;

    if (isNewCategory) {
      categoryId = await createCategory();
      if (!categoryId) {
        setLoading(false);
        return;
      }
    }

    const method = form.id ? "put" : "post";
    const url = form.id ? `/qcms/${form.id}` : "/qcms";
    const payload = { ...form, category_qcm_id: categoryId };

    try {
      await api[method](url, payload);
      setOpen(false);
      setForm({
        id: null,
        title: "",
        category_qcm_id: "",
        description: "",
        questions: generateDefaultQuestions(),
      });
      setIsNewCategory(false);
      setNewCategory({ name: "", description: "" });
      fetchQcms();
      toast.success(form.id ? "QCM mis à jour" : "QCM créé");
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/qcms/${qcmToDelete}`);
      fetchQcms();
      setIsDeleteDialogOpen(false);
      setQcmToDelete(null);
      toast.success("QCM supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (qcm) => {
    setSelectedQcm(qcm);
    setIsShowDialogOpen(true);
  };

  const addAnswer = (qIdx) => {
    const questions = [...form.questions];
    questions[qIdx].answers.push({ text: "", is_correct: false });
    setForm({ ...form, questions });
  };

  const removeAnswer = (qIdx, aIdx) => {
    const questions = [...form.questions];
    questions[qIdx].answers.splice(aIdx, 1);
    setForm({ ...form, questions });
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          text: "",
          type: "MULTIPLE_CHOICE",
          answers: Array(3)
            .fill(null)
            .map(() => ({ text: "", is_correct: false })),
        },
      ],
    });
  };

  const removeQuestion = (qIdx) => {
    const questions = [...form.questions];
    questions.splice(qIdx, 1);
    setForm({ ...form, questions });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Gestion des QCM
        </h1>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un QCM
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un QCM..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Liste des QCM</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Titre
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Catégorie
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Questions
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredQcms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-4 text-gray-500"
                  >
                    {searchTerm
                      ? "Aucun QCM ne correspond à votre recherche"
                      : "Aucun QCM trouvé"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQcms.map((qcm) => (
                  <motion.tr
                    key={qcm.id}
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-4">{qcm.title}</TableCell>
                    <TableCell className="py-4">
                      {qcm.category_qcm?.name || "N/A"}
                    </TableCell>
                    <TableCell className="py-4">
                      {qcm.questions.length}
                    </TableCell>
                    <TableCell className="py-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShow(qcm)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm({ ...qcm, id: qcm.id });
                          setOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQcmToDelete(qcm.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setForm({
              id: null,
              title: "",
              category_qcm_id: "",
              description: "",
              questions: generateDefaultQuestions(),
            });
            setIsNewCategory(false);
            setNewCategory({ name: "", description: "" });
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Modifier le QCM" : "Nouveau QCM"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Titre du QCM"
                  required
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewCategory(!isNewCategory)}
                  >
                    {isNewCategory
                      ? "Sélectionner existante"
                      : "Créer nouvelle"}
                  </Button>
                </div>
                {isNewCategory ? (
                  <div className="space-y-2">
                    <Input
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Nom de la nouvelle catégorie"
                      required
                    />
                    <Textarea
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description (optionnel)"
                    />
                  </div>
                ) : (
                  <Select
                    value={form.category_qcm_id}
                    onValueChange={(value) =>
                      setForm({ ...form, category_qcm_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Description du QCM"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Questions ({form.questions.length}/12)
              </h3>
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {form.questions.map((q, qIdx) => (
                  <Card key={qIdx} className="p-4 space-y-4">
                    <div>
                      <Label>Question {qIdx + 1}</Label>
                      <Input
                        value={q.text}
                        onChange={(e) => {
                          const questions = [...form.questions];
                          questions[qIdx].text = e.target.value;
                          setForm({ ...form, questions });
                        }}
                        placeholder="Texte de la question"
                        required
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={q.type}
                        onValueChange={(value) => {
                          const questions = [...form.questions];
                          questions[qIdx].type = value;
                          if (value === "TRUE_FALSE") {
                            questions[qIdx].answers = [
                              { text: "Vrai", is_correct: false },
                              { text: "Faux", is_correct: false },
                            ];
                          } else if (questions[qIdx].answers.length < 3) {
                            questions[qIdx].answers = Array(3)
                              .fill(null)
                              .map(() => ({ text: "", is_correct: false }));
                          }
                          setForm({ ...form, questions });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MULTIPLE_CHOICE">
                            Choix multiple
                          </SelectItem>
                          <SelectItem value="TRUE_FALSE">Vrai/Faux</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Réponses ({q.answers.length}/
                        {q.type === "TRUE_FALSE" ? 2 : 6})
                      </Label>
                      {q.answers.map((a, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <Input
                            value={a.text}
                            onChange={(e) => {
                              const questions = [...form.questions];
                              questions[qIdx].answers[aIdx].text =
                                e.target.value;
                              setForm({ ...form, questions });
                            }}
                            placeholder="Texte de la réponse"
                            disabled={q.type === "TRUE_FALSE"}
                            required
                          />
                          <input
                            type="checkbox"
                            checked={a.is_correct}
                            onChange={(e) => {
                              const questions = [...form.questions];
                              questions[qIdx].answers[aIdx].is_correct =
                                e.target.checked;
                              setForm({ ...form, questions });
                            }}
                          />
                          {q.type === "MULTIPLE_CHOICE" &&
                            q.answers.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswer(qIdx, aIdx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      ))}
                      {q.type === "MULTIPLE_CHOICE" && q.answers.length < 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAnswer(qIdx)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Ajouter une réponse
                        </Button>
                      )}
                    </div>
                    {form.questions.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer la
                        question
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
              {form.questions.length < 12 && (
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une question
                </Button>
              )}
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? form.id
                    ? "Modification..."
                    : "Création..."
                  : form.id
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show Dialog */}
      <Dialog open={isShowDialogOpen} onOpenChange={setIsShowDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQcm?.title}</DialogTitle>
          </DialogHeader>
          {selectedQcm && (
            <div className="space-y-6">
              <div>
                <Label className="font-medium">Description</Label>
                <p className="text-gray-600">
                  {selectedQcm.description || "Aucune description"}
                </p>
              </div>
              <div>
                <Label className="font-medium">Catégorie</Label>
                <p className="text-gray-600">
                  {selectedQcm.category_qcm?.name || "N/A"}
                </p>
              </div>
              <div>
                <Label className="font-medium">
                  Questions ({selectedQcm.questions.length})
                </Label>
                {selectedQcm.questions.length > 0 ? (
                  <div className="mt-2">
                    {selectedQcm.questions.map((question, index) => (
                      <Card key={question.id} className="p-4 mb-4">
                        <div className="space-y-2">
                          <p className="font-semibold">
                            Question {index + 1}: {question.text}
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {question.type}
                          </p>
                          <div>
                            <Label className="text-sm font-medium">
                              Réponses:
                            </Label>
                            <ul className="list-disc pl-5 mt-1">
                              {question.answers.map((answer) => (
                                <li key={answer.id} className="text-gray-600">
                                  {answer.text}{" "}
                                  {answer.is_correct ? "(Correcte)" : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucune question</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShowDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer ce QCM ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
