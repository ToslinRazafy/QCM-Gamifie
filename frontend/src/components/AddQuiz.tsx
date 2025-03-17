"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";

interface AddQuizProps {
  onQuizAdded: () => void;
  quizToEdit?: {
    id: string;
    title: string;
    description: string;
    category_id: string;
    niveau: string;
    questions: {
      text: string;
      time_limit: number;
      answers: { text: string; is_correct: boolean }[];
    }[];
  } | null;
}

export default function AddQuiz({ onQuizAdded, quizToEdit }: AddQuizProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState({
    title: quizToEdit?.title || "",
    description: quizToEdit?.description || "",
    category_id: quizToEdit?.category_id || "",
    user_id: quizToEdit?.user_id || "",
    niveau: quizToEdit?.niveau || "Facile",
    questions: [],
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsDraft, setQuestionsDraft] = useState(
    quizToEdit?.questions.length
      ? quizToEdit.questions.map((q) => ({
          text: q.text,
          time_limit: q.time_limit,
          answers: q.answers.map((a) => ({
            text: a.text,
            is_correct: a.is_correct,
          })),
        }))
      : [
          {
            text: "",
            time_limit: 30,
            answers: Array(3)
              .fill({})
              .map(() => ({ text: "", is_correct: false })),
          },
        ]
  );
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: null as File | null,
  });
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_QUESTIONS = 3;
  const MAX_QUESTIONS = 6;
  const MIN_RESPONSES = 3;
  const MAX_RESPONSES = 6;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Erreur lors du chargement des catégories");
    }
  };

  const handleDragOver = (
    e: React.DragEvent,
    setIsDragging: (value: boolean) => void
  ) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (setIsDragging: (value: boolean) => void) => {
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent,
    setData: (value: any) => void,
    field: string,
    setIsDragging: (value: boolean) => void
  ) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setData((prev: any) => ({ ...prev, [field]: file }));
    } else {
      toast.error("Veuillez déposer une image valide");
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setData: (value: any) => void,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setData((prev: any) => ({ ...prev, [field]: file }));
    } else {
      toast.error("Veuillez sélectionner une image valide");
    }
  };

  const removeImage = (setData: (value: any) => void, field: string) => {
    setData((prev: any) => ({ ...prev, [field]: null }));
  };

  const isStep1Valid = () => {
    return (
      quizData.title.trim() &&
      (quizData.category_id ||
        (newCategory.name.trim() && newCategory.description.trim())) &&
      quizData.niveau
    );
  };

  const isQuestionValid = (question: {
    text: string;
    time_limit: number;
    answers: { text: string; is_correct: boolean }[];
  }) => {
    const hasCorrectAnswer =
      question.answers.filter((r) => r.is_correct).length === 1;
    const validResponses = question.answers.every((r) => r.text.trim());
    return (
      question.text.trim() &&
      question.time_limit >= 10 &&
      validResponses &&
      hasCorrectAnswer &&
      question.answers.length >= MIN_RESPONSES &&
      question.answers.length <= MAX_RESPONSES
    );
  };

  const addQuestion = () => {
    const currentQuestion = questionsDraft[currentQuestionIndex];
    if (!isQuestionValid(currentQuestion)) {
      toast.error(
        "Vérifiez que la question est valide (texte, 3-6 réponses, une seule correcte)"
      );
      return;
    }
    if (questionsDraft.length < MAX_QUESTIONS) {
      setQuestionsDraft((prev) => [
        ...prev,
        {
          text: "",
          time_limit: 30,
          answers: Array(MIN_RESPONSES)
            .fill({})
            .map(() => ({ text: "", is_correct: false })),
        },
      ]);
      setCurrentQuestionIndex(questionsDraft.length);
    }
    setError(null);
  };

  const deleteQuestion = (index: number) => {
    if (questionsDraft.length <= MIN_QUESTIONS) {
      toast.error(`Le quiz doit avoir au moins ${MIN_QUESTIONS} questions`);
      return;
    }
    setQuestionsDraft((prev) => prev.filter((_, i) => i !== index));
    if (currentQuestionIndex >= questionsDraft.length - 1) {
      setCurrentQuestionIndex(
        questionsDraft.length - 2 >= 0 ? questionsDraft.length - 2 : 0
      );
    }
    setError(null);
  };

  const handleSubmit = async () => {
    if (
      questionsDraft.length < MIN_QUESTIONS ||
      questionsDraft.length > MAX_QUESTIONS
    ) {
      toast.error(
        `Le quiz doit avoir entre ${MIN_QUESTIONS} et ${MAX_QUESTIONS} questions. Actuellement : ${questionsDraft.length}`
      );
      return;
    }
    if (!questionsDraft.every(isQuestionValid)) {
      toast.error("Toutes les questions doivent être valides");
      return;
    }

    const finalQuizData = {
      ...quizData,
      questions: questionsDraft,
      user_id: user?.id,
    };

    try {
      if (quizToEdit) {
        await api.put(`/quizzes/${quizToEdit.id}`, finalQuizData);
        toast.success("Quiz modifié avec succès !");
      } else {
        await api.post("/quizzes", finalQuizData);
        toast.success("Quiz ajouté avec succès !");
      }
      resetForm();
      onQuizAdded();
    } catch (err) {
      toast.error(
        err.response?.data?.errors || "Erreur lors de la sauvegarde du quiz"
      );
    }
  };

  const createCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      toast.error("Nom et description requis pour la nouvelle catégorie");
      return;
    }
    const formData = new FormData();
    formData.append("name", newCategory.name);
    formData.append("description", newCategory.description);
    if (newCategory.image) formData.append("image", newCategory.image);

    try {
      const res = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCategories((prev) => [...prev, res.data]);
      setQuizData({ ...quizData, category_id: res.data.id });
      setNewCategory({ name: "", description: "", image: null });
      setShowNewCategoryForm(false);
      toast.success(
        "Catégorie créée avec succès ! Remplissez le titre du quiz."
      );
      // Ne change pas l'étape, reste à step 1 pour remplir le titre
    } catch (err) {
      toast.error(
        err.response?.data?.errors ||
          "Erreur lors de la création de la catégorie"
      );
    }
  };

  const resetForm = () => {
    setQuizData({
      title: "",
      description: "",
      category_id: "",
      user_id: "",
      niveau: "Facile",
      questions: [],
    });
    setQuestionsDraft([
      {
        text: "",
        time_limit: 30,
        answers: Array(MIN_RESPONSES)
          .fill({})
          .map(() => ({ text: "", is_correct: false })),
      },
    ]);
    setCurrentQuestionIndex(0);
    setStep(1);
    setShowNewCategoryForm(false);
    setError(null);
  };

  const addResponse = () => {
    if (questionsDraft[currentQuestionIndex].answers.length < MAX_RESPONSES) {
      setQuestionsDraft((prev) =>
        prev.map((q, i) =>
          i === currentQuestionIndex
            ? { ...q, answers: [...q.answers, { text: "", is_correct: false }] }
            : q
        )
      );
    }
  };

  const removeResponse = (index: number) => {
    if (questionsDraft[currentQuestionIndex].answers.length > MIN_RESPONSES) {
      setQuestionsDraft((prev) =>
        prev.map((q, i) =>
          i === currentQuestionIndex
            ? { ...q, answers: q.answers.filter((_, idx) => idx !== index) }
            : q
        )
      );
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setStep(1);
    }
    setError(null);
  };

  const goToNextQuestion = () => {
    const currentQuestion = questionsDraft[currentQuestionIndex];
    if (!isQuestionValid(currentQuestion)) {
      toast.error(
        "Vérifiez que la question actuelle est valide avant de passer à la suivante"
      );
      return;
    }
    if (currentQuestionIndex < questionsDraft.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (questionsDraft.length < MAX_QUESTIONS) {
      addQuestion();
    }
    setError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {quizToEdit ? "Modifier le Quiz" : "Nouveau Quiz"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {step === 1 ? (
          <div className="space-y-4">
            {!showNewCategoryForm ? (
              <>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {quizData.category_id
                          ? categories.find(
                              (cat) => cat.id === quizData.category_id
                            )?.name
                          : "Sélectionner une catégorie"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher une catégorie..." />
                        <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat.id}
                              value={cat.name}
                              onSelect={() => {
                                setQuizData({
                                  ...quizData,
                                  category_id: cat.id,
                                });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  quizData.category_id === cat.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {cat.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowNewCategoryForm(true)}
                  className="w-full"
                >
                  Créer une nouvelle catégorie
                </Button>
              </>
            ) : (
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold">Nouvelle catégorie</h3>
                <Input
                  placeholder="Nom de la catégorie *"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Description *"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                />
                <div
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-all ${
                    isDraggingCategory
                      ? "border-primary bg-muted"
                      : "hover:border-primary"
                  }`}
                  onDragOver={(e) => handleDragOver(e, setIsDraggingCategory)}
                  onDragLeave={() => handleDragLeave(setIsDraggingCategory)}
                  onDrop={(e) =>
                    handleDrop(
                      e,
                      setNewCategory,
                      "image",
                      setIsDraggingCategory
                    )
                  }
                >
                  <Label
                    htmlFor="new-cat-image"
                    className="flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    <span>
                      {newCategory.image
                        ? newCategory.image.name
                        : "Déposez ou sélectionnez une image (optionnel)"}
                    </span>
                  </Label>
                  <Input
                    id="new-cat-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e, setNewCategory, "image")
                    }
                    className="hidden"
                  />
                </div>
                {newCategory.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={URL.createObjectURL(newCategory.image)}
                      alt="Prévisualisation"
                      className="max-w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(setNewCategory, "image")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewCategoryForm(false)}
                    className="w-full"
                  >
                    Annuler
                  </Button>
                  <Button onClick={createCategory} className="w-full">
                    Créer et continuer
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="title">Titre du quiz *</Label>
              <Input
                id="title"
                placeholder="Entrez le titre"
                value={quizData.title}
                onChange={(e) =>
                  setQuizData({ ...quizData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Entrez une description (optionnel)"
                value={quizData.description}
                onChange={(e) =>
                  setQuizData({ ...quizData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Niveau *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {quizData.niveau}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandGroup>
                      {["Facile", "Moyen", "Difficile"].map((level) => (
                        <CommandItem
                          key={level}
                          value={level}
                          onSelect={() =>
                            setQuizData({ ...quizData, niveau: level })
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              quizData.niveau === level
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {level}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid()}
              className="w-full"
            >
              Suivant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question-text">Question *</Label>
              <Input
                id="question-text"
                placeholder="Entrez la question"
                value={questionsDraft[currentQuestionIndex].text}
                onChange={(e) =>
                  setQuestionsDraft((prev) =>
                    prev.map((q, i) =>
                      i === currentQuestionIndex
                        ? { ...q, text: e.target.value }
                        : q
                    )
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="time-limit">Temps limite (secondes) *</Label>
              <Input
                id="time-limit"
                type="number"
                placeholder="Temps en secondes"
                value={questionsDraft[currentQuestionIndex].time_limit}
                onChange={(e) =>
                  setQuestionsDraft((prev) =>
                    prev.map((q, i) =>
                      i === currentQuestionIndex
                        ? { ...q, time_limit: Number(e.target.value) || 10 }
                        : q
                    )
                  )
                }
                min={10}
              />
            </div>
            {questionsDraft[currentQuestionIndex].answers.map(
              (answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder={`Réponse ${index + 1} *`}
                    value={answer.text}
                    onChange={(e) => {
                      const newAnswers = [
                        ...questionsDraft[currentQuestionIndex].answers,
                      ];
                      newAnswers[index].text = e.target.value;
                      setQuestionsDraft((prev) =>
                        prev.map((q, i) =>
                          i === currentQuestionIndex
                            ? { ...q, answers: newAnswers }
                            : q
                        )
                      );
                    }}
                  />
                  <input
                    type="checkbox"
                    checked={answer.is_correct}
                    onChange={(e) => {
                      const newAnswers = questionsDraft[
                        currentQuestionIndex
                      ].answers.map((a, i) => ({
                        ...a,
                        is_correct: i === index ? e.target.checked : false,
                      }));
                      setQuestionsDraft((prev) =>
                        prev.map((q, i) =>
                          i === currentQuestionIndex
                            ? { ...q, answers: newAnswers }
                            : q
                        )
                      );
                    }}
                  />
                  {questionsDraft[currentQuestionIndex].answers.length >
                    MIN_RESPONSES && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResponse(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              )
            )}
            {questionsDraft[currentQuestionIndex].answers.length <
              MAX_RESPONSES && (
              <Button
                variant="outline"
                onClick={addResponse}
                className="w-full"
              >
                Ajouter une réponse (
                {questionsDraft[currentQuestionIndex].answers.length}/
                {MAX_RESPONSES})
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                className="w-full"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                onClick={goToNextQuestion}
                disabled={
                  questionsDraft.length >= MAX_QUESTIONS &&
                  currentQuestionIndex === questionsDraft.length - 1
                }
                className="w-full"
              >
                Suivant
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteQuestion(currentQuestionIndex)}
                disabled={questionsDraft.length <= MIN_QUESTIONS}
                className="w-full"
              >
                Supprimer cette question
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={questionsDraft.length < MIN_QUESTIONS}
                className="w-full"
              >
                {quizToEdit ? "Mettre à jour" : "Terminer"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Questions ajoutées : {questionsDraft.length} / {MAX_QUESTIONS}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
