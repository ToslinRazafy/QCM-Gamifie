"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ExamenPlay() {
  const [examen, setExamen] = useState<any>(null);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [cheatAttempts, setCheatAttempts] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    fetchExamen();
    // setupAntiCheat();
    // return () => cleanupAntiCheat();
  }, [id]);

  useEffect(() => {
    if (examen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 30 && prev > 0)
            toast.warning("Attention : moins de 30 secondes restantes !");
          if (prev <= 0) {
            submitExamen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examen, timeLeft]);

  const fetchExamen = async () => {
    try {
      const res = await api.get(`/examens/${id}`);
      setExamen(res.data);
      setTimeLeft(res.data.timer);
      setTotalTime(res.data.timer); // Pour la barre de progression
    } catch (error: any) {
      console.error("Erreur lors du chargement de l'examen :", error);
      if (error.response?.status === 403) {
        toast.error("Vous avez déjà passé cet examen.");
        router.push("/examen");
      } else {
        toast.error("Impossible de charger l'examen.");
      }
    }
  };

  // const setupAntiCheat = () => {
  //   window.addEventListener("blur", handleCheatAttempt);
  //   window.addEventListener("contextmenu", (e) => e.preventDefault());
  //   window.addEventListener("keydown", blockShortcuts);
  //   document.body.style.userSelect = "none";
  //   window.history.pushState(null, "", window.location.href);
  //   window.onpopstate = () => {
  //     window.history.pushState(null, "", window.location.href);
  //     handleCheatAttempt();
  //   };
  // };

  // const cleanupAntiCheat = () => {
  //   window.removeEventListener("blur", handleCheatAttempt);
  //   window.removeEventListener("contextmenu", (e) => e.preventDefault());
  //   window.removeEventListener("keydown", blockShortcuts);
  //   document.body.style.userSelect = "auto";
  //   window.onpopstate = null;
  // };

  // const handleCheatAttempt = () => {
  //   setCheatAttempts((prev) => prev + 1);
  //   toast.error("Tentative de triche détectée !");
  //   if (cheatAttempts >= 2) submitExamen(true);
  // };

  // const blockShortcuts = (e: KeyboardEvent) => {
  //   if (e.ctrlKey || e.altKey || e.key === "F5" || e.key === "F12") {
  //     e.preventDefault();
  //     handleCheatAttempt();
  //   }
  // };

  const handleAnswerChange = (
    questionId: string,
    answerId: string,
    type: string
  ) => {
    setAnswers((prev: any) => {
      if (type === "TRUE_FALSE") {
        return { ...prev, [questionId]: [answerId] };
      } else {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(answerId)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(
              (id: string) => id !== answerId
            ),
          };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, answerId] };
        }
      }
    });
  };

  const goToPreviousPair = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex((prev) => prev - 1);
    }
  };

  const goToNextPair = () => {
    const questions = examen.qcms.flatMap((qcm: any) => qcm.questions);
    if (currentPairIndex < Math.floor(questions.length / 2)) {
      setCurrentPairIndex((prev) => prev + 1);
    }
  };

  const submitExamen = async (forced = false) => {
    if (forced)
      toast.error("Examen terminé en raison de tentatives de triche.");
    const questions = examen.qcms.flatMap((qcm: any) => qcm.questions);
    const formattedAnswers = questions.map((question: any) => ({
      question_id: question.id,
      answer_ids: answers[question.id] || [], // Réponse vide = []
    }));

    try {
      const res = await api.post(`/examens/${id}/submit`, {
        answers: formattedAnswers,
      });
      setResult(res.data);
      setIsResultOpen(true);
    } catch (error: any) {
      console.error("Erreur lors de la soumission :", error);
      if (error.response?.status === 500) {
        toast.error("Erreur serveur. Votre score est considéré comme 0.");
        setResult({ score: 0, submitted_at: new Date().toISOString() });
        setIsResultOpen(true);
      } else if (error.response?.status === 403) {
        toast.error("Vous avez déjà soumis cet examen.");
      } else {
        toast.error("Erreur lors de la soumission de l'examen.");
      }
    }
  };

  const handleCloseResult = () => {
    setIsResultOpen(false);
    router.push(`/examen/my-results`);
  };

  if (!examen) return <div className="text-center text-lg">Chargement...</div>;

  const questions = examen.qcms.flatMap((qcm: any) => qcm.questions);
  const startIdx = currentPairIndex * 2;
  const currentQuestions = questions.slice(startIdx, startIdx + 2);
  const categories = examen.qcms
    .map((qcm: any) => qcm.category_qcm?.name || "Non catégorisé")
    .filter(
      (name: string, index: number, self: string[]) =>
        self.indexOf(name) === index
    )
    .join(", ");
  const progressValue = (timeLeft / totalTime) * 100;

  const chartData = result
    ? [
        { name: "Correct", value: result.score },
        { name: "Incorrect", value: 20 - result.score },
      ]
    : [];

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{examen.title}</h1>
            <div className="flex items-center space-x-4">
              <div
                className={`text-xl font-semibold ${
                  timeLeft <= 30
                    ? "text-red-500 animate-pulse"
                    : "text-gray-700"
                }`}
              >
                Temps restant : {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </div>
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span>Tentatives de triche : {cheatAttempts}</span>
              </div>
            </div>
          </div>
          <Progress value={progressValue} className="mb-4" />
          <div className="text-sm text-gray-600 mb-4">
            <p>
              <strong>Catégorie(s) :</strong> {categories}
            </p>
            <p>
              <strong>Créé par :</strong> {examen.user?.name || "Inconnu"}
            </p>
            <p>
              <strong>Nombre de questions :</strong> {questions.length}
            </p>
            <p>
              <strong>Section :</strong> {currentPairIndex + 1} /{" "}
              {Math.ceil(questions.length / 2)}
            </p>
          </div>
          <div className="space-y-8">
            {currentQuestions.map((question: any) => (
              <div
                key={question.id}
                className="bg-gray-50 p-4 rounded-lg shadow-sm"
              >
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  {question.text}
                </h2>
                {question.type === "TRUE_FALSE" ? (
                  <RadioGroup
                    value={answers[question.id]?.[0] || ""}
                    onValueChange={(value) =>
                      handleAnswerChange(question.id, value, "TRUE_FALSE")
                    }
                    className="space-y-2"
                  >
                    {question.answers.map((answer: any) => (
                      <div
                        key={answer.id}
                        className="flex items-center space-x-3"
                      >
                        <RadioGroupItem value={answer.id} id={answer.id} />
                        <Label htmlFor={answer.id} className="text-gray-700">
                          {answer.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    {question.answers.map((answer: any) => (
                      <div
                        key={answer.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={answer.id}
                          checked={
                            answers[question.id]?.includes(answer.id) || false
                          }
                          onCheckedChange={() =>
                            handleAnswerChange(
                              question.id,
                              answer.id,
                              "MULTIPLE_CHOICE"
                            )
                          }
                        />
                        <Label htmlFor={answer.id} className="text-gray-700">
                          {answer.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={goToPreviousPair}
              disabled={currentPairIndex === 0}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Précédent
            </Button>
            <Button
              onClick={goToNextPair}
              disabled={currentPairIndex >= Math.floor(questions.length / 2)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
            >
              Suivant
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
          <Button
            onClick={() => submitExamen()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Soumettre l'examen
          </Button>
        </div>
      </div>

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Résultat de l'examen
            </DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <PieChart width={250} height={250}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-gray-800">
                  {result.score}/20
                </p>
                <p className="text-lg text-gray-600">
                  {((result.score / 20) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Soumis le : {new Date(result.submitted_at).toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleCloseResult}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              >
                Voir tous les résultats
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
