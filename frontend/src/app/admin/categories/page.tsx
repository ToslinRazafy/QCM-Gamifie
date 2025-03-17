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
import { Label } from "@/components/ui/label";
import { Trash, Plus, Eye, Edit, Upload } from "lucide-react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import Image from "next/image";
import { URL_IMG_BACKEND } from "@/constant/index";
import { toast } from "sonner";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: null as File | null,
    preview: null as string | null,
  });
  const [editCategory, setEditCategory] = useState<{
    id: string;
    name: string;
    description: string;
    image: File | string | null;
    preview: string | null;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      toast.error("Le nom et la description sont requis");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("name", newCategory.name);
    formData.append("description", newCategory.description);
    if (newCategory.image) formData.append("image", newCategory.image);

    try {
      const res = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCategories([...categories, res.data]);
      setNewCategory({ name: "", description: "", image: null, preview: null });
      setShowForm(false);
      toast.success("Catégorie ajoutée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async () => {
    if (!editCategory?.name || !editCategory?.description) {
      toast.error("Le nom et la description sont requis");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("name", editCategory.name);
    formData.append("description", editCategory.description);
    if (editCategory.image instanceof File)
      formData.append("image", editCategory.image);

    try {
      const res = await api.patch(`/categories/${editCategory.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCategories(
        categories.map((c) => (c.id === res.data.id ? res.data : c))
      );
      setEditCategory(null);
      toast.success("Catégorie mise à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async () => {
    setLoading(true);
    try {
      await api.delete(`/categories/${categoryToDelete}`);
      setCategories(categories.filter((c) => c.id !== categoryToDelete));
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast.success("Catégorie supprimée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file: File | null, isEdit = false) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (isEdit && editCategory) {
        setEditCategory({ ...editCategory, image: file, preview: previewUrl });
      } else {
        setNewCategory({ ...newCategory, image: file, preview: previewUrl });
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isEdit = false) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file, isEdit);
    } else {
      toast.error("Veuillez déposer une image valide");
    }
  };

  const removeImage = (isEdit = false) => {
    if (isEdit && editCategory) {
      setEditCategory({ ...editCategory, image: null, preview: null });
    } else {
      setNewCategory({ ...newCategory, image: null, preview: null });
    }
    toast.info("Image supprimée");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Gestion des Catégories</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-[hsl(var(--muted))]"
        >
          {showForm ? "Liste" : "Ajouter"}
          {showForm ? null : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ajouter une catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder="Nom de la catégorie"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                placeholder="Description"
              />
            </div>
            <div>
              <Label>Image</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragging
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                    : "border-[hsl(var(--border))]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleDrop(e)}
              >
                {newCategory.preview ? (
                  <div className="relative">
                    <Image
                      src={newCategory.preview}
                      alt="Prévisualisation"
                      width={100}
                      height={100}
                      className="rounded mx-auto"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0"
                      onClick={() => removeImage()}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Glissez une image ici ou{" "}
                      <label className="text-[hsl(var(--primary))] cursor-pointer">
                        cliquez pour sélectionner
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageChange(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button onClick={addCategory} className="w-full" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Créateur</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <motion.tr
                key={category.id}
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TableCell>
                  {category.image && (
                    <img
                      src={`${URL_IMG_BACKEND}/${category.image}`}
                      alt={category.name}
                      className="rounded object-cover w-16 h-16"
                    />
                  )}
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>{category.user?.pseudo || "N/A"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEditCategory({
                        ...category,
                        preview: category.image
                          ? `${URL_IMG_BACKEND}/${category.image}`
                          : null,
                      })
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCategoryToDelete(category.id);
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <p>Êtes-vous sûr de vouloir supprimer cette catégorie ?</p>
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
              onClick={deleteCategory}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editCategory && (
        <Dialog
          open={!!editCategory}
          onOpenChange={() => setEditCategory(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editCategory.name}
                  onChange={(e) =>
                    setEditCategory({ ...editCategory, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editCategory.description}
                  onChange={(e) =>
                    setEditCategory({
                      ...editCategory,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Image</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                      : "border-[hsl(var(--border))]"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => handleDrop(e, true)}
                >
                  {editCategory.preview ? (
                    <div className="relative">
                      <Image
                        src={editCategory.preview}
                        alt="Prévisualisation"
                        width={100}
                        height={100}
                        className="rounded mx-auto"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => removeImage(true)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Glissez une image ici ou{" "}
                        <label className="text-[hsl(var(--primary))] cursor-pointer">
                          cliquez pour sélectionner
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageChange(
                                e.target.files?.[0] || null,
                                true
                              )
                            }
                          />
                        </label>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCategory(null)}>
                Annuler
              </Button>
              <Button onClick={updateCategory} disabled={loading}>
                {loading ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedCategory && (
        <Dialog
          open={!!selectedCategory}
          onOpenChange={() => setSelectedCategory(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCategory.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Description</p>
                <p>{selectedCategory.description}</p>
              </div>
              {selectedCategory.image && (
                <img
                  src={`${URL_IMG_BACKEND}/${selectedCategory.image}`}
                  alt={selectedCategory.name}
                  className="rounded object-cover w-20 h-20"
                />
              )}
              <div>
                <p className="font-medium">Créateur</p>
                <p>{selectedCategory.user?.pseudo || "N/A"}</p>
              </div>
              <div>
                <p className="font-medium">Quizzes associés</p>
                {selectedCategory.quizzes?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead>Questions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCategory.quizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>{quiz.title}</TableCell>
                          <TableCell>{quiz.niveau}</TableCell>
                          <TableCell>{quiz.questions?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Aucun quiz</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedCategory(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
