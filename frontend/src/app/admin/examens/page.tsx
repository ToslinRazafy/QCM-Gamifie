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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { Plus, Edit, Trash2, Send, Search } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/components/AuthProvider";

// Fonction pour traduire les statuts en français
const translateStatus = (status) => {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "PUBLISHED":
      return "Publié";
    case "ENDED":
      return "Terminé";
    default:
      return status; // Retourne le statut brut si non reconnu
  }
};

export default function Examens() {
  const { user } = useAuth();
  const [examens, setExamens] = useState([]);
  const [filteredExamens, setFilteredExamens] = useState([]);
  const [qcms, setQcms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examenToDelete, setExamenToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    title: "",
    timer: 60,
    qcm_ids: [],
  });

  useEffect(() => {
    fetchExamens();
    fetchQcms();

    const token = localStorage.getItem("token");
    if (token && user?.id) {
      const socket = getSocket(token, user.id);

      socket.on("examen.updated", (data) => {
        console.log("Événement examen.updated reçu:", data);
        const updatedExamen = data.examen;

        setExamens((prevExamens) => {
          if (!updatedExamen.qcms) {
            return prevExamens.filter(
              (examen) => examen.id !== updatedExamen.id
            );
          }
          const exists = prevExamens.some(
            (examen) => examen.id === updatedExamen.id
          );
          if (exists) {
            return prevExamens.map((examen) =>
              examen.id === updatedExamen.id ? updatedExamen : examen
            );
          }
          return [...prevExamens, updatedExamen];
        });

        setFilteredExamens((prevFiltered) => {
          if (!updatedExamen.qcms) {
            return prevFiltered.filter(
              (examen) => examen.id !== updatedExamen.id
            );
          }
          const exists = prevFiltered.some(
            (examen) => examen.id === updatedExamen.id
          );
          if (exists) {
            return prevFiltered.map((examen) =>
              examen.id === updatedExamen.id ? updatedExamen : examen
            );
          }
          return [...prevFiltered, updatedExamen];
        });

        toast.success(
          updatedExamen.qcms
            ? `Examen "${updatedExamen.title}" mis à jour en temps réel`
            : `Examen "${updatedExamen.title}" supprimé en temps réel`
        );
      });

      return () => {
        socket.off("examen.updated");
      };
    }
  }, [user?.id]);

  useEffect(() => {
    const filtered = examens.filter((examen) =>
      examen.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExamens(filtered);
  }, [searchTerm, examens]);

  const fetchExamens = async () => {
    setLoading(true);
    try {
      const res = await api.get("/examens");
      setExamens(res.data);
      setFilteredExamens(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des examens");
    } finally {
      setLoading(false);
    }
  };

  const fetchQcms = async () => {
    try {
      const res = await api.get("/qcms");
      setQcms(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des QCM");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Le titre est requis");
      return;
    }
    if (!form.timer || form.timer < 60) {
      toast.error("Le timer doit être d'au moins 60 secondes");
      return;
    }
    if (!Array.isArray(form.qcm_ids) || form.qcm_ids.length < 1) {
      toast.error("Vous devez sélectionner au moins 1 QCM");
      return;
    }

    setLoading(true);
    const method = form.id ? "put" : "post";
    const url = form.id ? `/examens/${form.id}` : "/examens";
    try {
      await api[method](url, {
        ...form,
        qcm_ids: form.qcm_ids,
      });
      setOpen(false);
      setForm({ id: null, title: "", timer: 60, qcm_ids: [] });
      toast.success(form.id ? "Examen mis à jour" : "Examen créé");
    fetchExamens();

    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors.title) toast.error("Le titre est invalide");
        if (errors.timer)
          toast.error("Le timer doit être d'au moins 60 secondes");
        if (errors.qcm_ids) toast.error("Sélectionnez au moins 1 QCM valide");
      } else {
        toast.error("Erreur lors de l'opération");
        console.error(error.response?.data || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/examens/${examenToDelete}`);
      setIsDeleteDialogOpen(false);
      setExamenToDelete(null);
      toast.success("Examen supprimé");
    fetchExamens();

    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    setLoading(true);
    try {
      await api.post(`/examens/${id}/publish`);
      toast.success("Examen publié");
    fetchExamens();

    } catch (error) {
      toast.error("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
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
          Gestion des Examens
        </h1>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un Examen
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
              placeholder="Rechercher un examen..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Liste des Examens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Titre
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Timer (s)
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  QCMs
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Statut
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredExamens.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-gray-500"
                  >
                    {searchTerm
                      ? "Aucun examen ne correspond à votre recherche"
                      : "Aucun examen trouvé"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExamens.map((examen) => (
                  <motion.tr
                    key={examen.id}
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-4">{examen.title}</TableCell>
                    <TableCell className="py-4">{examen.timer}</TableCell>
                    <TableCell className="py-4">{examen.qcms.length}</TableCell>
                    <TableCell className="py-4">
                      {translateStatus(examen.status)}
                    </TableCell>
                    <TableCell className="py-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm({
                            id: examen.id,
                            title: examen.title,
                            timer: examen.timer,
                            qcm_ids: examen.qcms.map((q) => q.id),
                          });
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
                          setExamenToDelete(examen.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {examen.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(examen.id)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
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
          if (!isOpen) setForm({ id: null, title: "", timer: 60, qcm_ids: [] });
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Modifier l'Examen" : "Nouvel Examen"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre de l'examen"
                required
              />
            </div>
            <div>
              <Label>Timer (secondes)</Label>
              <Input
                type="number"
                value={form.timer}
                onChange={(e) =>
                  setForm({ ...form, timer: parseInt(e.target.value) || 0 })
                }
                placeholder="Timer en secondes"
                min="60"
                required
              />
            </div>
            <div>
              <Label>QCMs ({form.qcm_ids.length}/1 minimum)</Label>
              <Select
                isMulti
                options={qcms.map((qcm) => ({
                  value: qcm.id,
                  label: qcm.title,
                }))}
                value={qcms
                  .filter((qcm) => form.qcm_ids.includes(qcm.id))
                  .map((qcm) => ({
                    value: qcm.id,
                    label: qcm.title,
                  }))}
                onChange={(selectedOptions) =>
                  setForm({
                    ...form,
                    qcm_ids: selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [],
                  })
                }
                placeholder="Sélectionner des QCM..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>
            <DialogFooter>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer cet examen ?
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
