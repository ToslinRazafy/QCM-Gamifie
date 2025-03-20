"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function MyResults() {
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      const res = await api.get("/examens/results");
      setResults(res.data.filter((r: any) => r.user_id === user?.id));
    } catch (error) {
      console.error("Erreur lors de la récupération des résultats :", error);
    }
  };

  const openResultDetails = (result: any) => {
    setSelectedResult(result);
    setIsDialogOpen(true);
  };

  const chartData = selectedResult
    ? [
        { name: "Correct", value: selectedResult.score },
        { name: "Incorrect", value: 20 - selectedResult.score },
      ]
    : [];

  const COLORS = ["#22c55e", "#ef4444"];

  const isAnswerCorrect = (question: any, userAnswerIds: string[]) => {
    const correctIds = question.answers
      .filter((a: any) => a.is_correct)
      .map((a: any) => a.id);
    return (
      correctIds.length === userAnswerIds.length &&
      correctIds.every((id: string) => userAnswerIds.includes(id)) &&
      userAnswerIds.every((id: string) => correctIds.includes(id))
    );
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Mes Résultats</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Examen</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result: any) => (
            <TableRow key={result.id}>
              <TableCell>{result.examen?.title || "Examen inconnu"}</TableCell>
              <TableCell>{result.score}/20</TableCell>
              <TableCell>
                {new Date(result.submitted_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openResultDetails(result)}
                >
                  <Eye className="h-5 w-5 text-gray-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Popup pour les détails du résultat */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-lg shadow-xl p-6 overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Détails du résultat
            </DialogTitle>
          </DialogHeader>
          {selectedResult && (
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
              <div className="text-gray-700 space-y-4">
                <p>
                  <strong>Examen :</strong>{" "}
                  {selectedResult.examen?.title || "Inconnu"}
                </p>
                <p>
                  <strong>Score :</strong> {selectedResult.score}/20 (
                  {((selectedResult.score / 20) * 100).toFixed(1)}%)
                </p>
                <p>
                  <strong>Date de soumission :</strong>{" "}
                  {new Date(selectedResult.submitted_at).toLocaleString()}
                </p>
                <div>
                  <strong>QCMs associés :</strong>
                  {selectedResult.examen?.qcms?.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1 space-y-2">
                      {selectedResult.examen.qcms.map((qcm: any) => (
                        <li key={qcm.id}>
                          <span className="font-semibold">{qcm.title}</span>{" "}
                          (Catégorie :{" "}
                          {qcm.category_qcm?.name || "Non catégorisé"})
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {qcm.questions.map((question: any) => {
                              const userAnswer = selectedResult.answers.find(
                                (a: any) => a.question_id === question.id
                              );
                              const userAnswerIds = userAnswer
                                ? userAnswer.answer_ids
                                : [];
                              const isCorrect = isAnswerCorrect(
                                question,
                                userAnswerIds
                              );

                              return (
                                <li key={question.id}>
                                  <p>{question.text}</p>
                                  <ul className="list-none pl-2">
                                    {question.answers.map((answer: any) => {
                                      const isUserSelected =
                                        userAnswerIds.includes(answer.id);
                                      const isCorrectAnswer = answer.is_correct;

                                      return (
                                        <li key={answer.id}>
                                          <span
                                            className={
                                              isUserSelected
                                                ? isCorrect
                                                  ? "text-green-600"
                                                  : "text-red-600"
                                                : isCorrectAnswer
                                                ? "text-green-600"
                                                : "text-gray-600"
                                            }
                                          >
                                            - {answer.text}{" "}
                                            {isUserSelected &&
                                              isCorrect &&
                                              "(Correct)"}
                                            {isUserSelected &&
                                              !isCorrect &&
                                              "(Incorrect)"}
                                            {!isUserSelected &&
                                              isCorrectAnswer &&
                                              "(Bonne réponse)"}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucun QCM associé trouvé.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
