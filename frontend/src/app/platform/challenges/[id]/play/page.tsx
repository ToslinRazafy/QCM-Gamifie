"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { getSocket, listenToChallenge } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";

interface Answer {
  id: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  text: string;
  time_limit: number | null;
  answers: Answer[];
}

interface Player {
  id: string;
  pseudo: string;
}

interface Challenge {
  id: string;
  player1_id: string;
  player2_id: string;
  player1: Player;
  player2: Player;
  status: "pending" | "active" | "completed";
  winner_id?: string | null;
  player1_bet: number;
  player2_bet: number;
  player1_score: number;
  player2_score: number;
  shuffled_questions: string;
  current_question_index: number;
  question_answered_by?: string | null;
}

export default function ChallengePlayPage() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isChallengeFinished, setIsChallengeFinished] = useState(false);
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  const fetchChallenge = async () => {
    try {
      const response = await api.get(`/challenges/${id}`);
      console.log("Réponse /challenges/{id}:", response.data);

      const activeChallenge = response.data;
      if (!activeChallenge) {
        toast.error("Défi non trouvé ou non actif");
        return;
      }

      const parsedQuestions = JSON.parse(activeChallenge.shuffled_questions);
      setChallenge(activeChallenge);
      setShuffledQuestions(parsedQuestions);
      setTimeLeft(
        parsedQuestions[activeChallenge.current_question_index]?.time_limit ||
          30
      );

      if (activeChallenge.status === "completed" || activeChallenge.winner_id) {
        setIsChallengeFinished(true);
        if (activeChallenge.winner_id === user?.id) setShowVictoryPopup(true);
      }
    } catch (error: any) {
      console.error(
        "Erreur lors du chargement du défi:",
        error.response?.data || error.message
      );
      toast.error("Impossible de charger le défi");
    }
  };

  useEffect(() => {
    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id as string
      )
    ) {
      toast.error("ID de défi invalide");
      window.location.href = "/platform/challenges";
      return;
    }

    if (isLoading || !isAuthenticated || !user) return;

    fetchChallenge();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Erreur d'authentification. Veuillez vous reconnecter.");
      return;
    }

    socketRef.current = getSocket(token, user.id);
    socketRef.current.on("connect", () => {
      console.log("Socket connecté pour le défi:", socketRef.current.id);
      const challengeRoom = `private-challenges.${id}`;
      socketRef.current.emit("join", { room: challengeRoom });
      console.log(`Rejoint la room du défi: ${challengeRoom}`);

      listenToChallenge(
        socketRef.current,
        id as string,
        user.id,
        (event, data) => {
          console.log(
            `Événement Socket.IO reçu dans listenToChallenge: ${event}`,
            data
          );
          switch (event) {
            case "challenge.started":
              const parsedQuestionsStarted = JSON.parse(
                data.challenge.shuffled_questions
              );
              setChallenge(data.challenge);
              setShuffledQuestions(parsedQuestionsStarted);
              setTimeLeft(parsedQuestionsStarted[0]?.time_limit || 30);
              toast.success("Défi démarré", {
                description: "Le défi commence maintenant !",
              });
              break;
            case "question.answered":
              setChallenge((prev) => {
                if (!prev) return prev;
                const updatedChallenge = {
                  ...prev,
                  player1_score: data.challenge.player1_score,
                  player2_score: data.challenge.player2_score,
                  question_answered_by: data.challenge.question_answered_by,
                };
                console.log(
                  "Mise à jour après question.answered:",
                  updatedChallenge
                );
                return updatedChallenge;
              });
              if (
                data.user_id === user.id &&
                data.answer_id === selectedAnswer
              ) {
                toast.success("Bonne réponse !", {
                  description: "Vous avez marqué 10 points !",
                });
              }
              setSelectedAnswer(null);
              break;
            case "next.question":
              setChallenge((prev) => {
                if (!prev) return prev;
                const updatedChallenge = {
                  ...prev,
                  current_question_index: data.challenge.current_question_index,
                  question_answered_by: null,
                };
                const nextQuestion =
                  shuffledQuestions[data.challenge.current_question_index];
                setTimeLeft(nextQuestion?.time_limit || 30);
                setSelectedAnswer(null);
                console.log("Mise à jour après next.question:", {
                  current_question_index: data.challenge.current_question_index,
                  nextQuestion,
                });
                return updatedChallenge;
              });
              break;
            case "challenge.abandoned":
              setChallenge(data.challenge);
              setIsChallengeFinished(true);
              const isWinnerAbandon = data.challenge.winner_id === user.id;
              toast.success(isWinnerAbandon ? "Victoire" : "Défaite", {
                description: isWinnerAbandon
                  ? "Votre adversaire a abandonné !"
                  : "Vous avez perdu par abandon.",
              });
              if (isWinnerAbandon) setShowVictoryPopup(true);
              break;
            case "challenge.completed":
              setChallenge(data.challenge);
              setIsChallengeFinished(true);
              const isWinnerCompleted = data.challenge.winner_id === user.id;
              toast.success(isWinnerCompleted ? "Victoire" : "Défaite", {
                description: isWinnerCompleted
                  ? "Félicitations, vous avez gagné !"
                  : "Vous avez perdu.",
              });
              if (isWinnerCompleted) setShowVictoryPopup(true);
              break;
          }
        }
      );
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Erreur de connexion Socket:", error);
      toast.error("Erreur de connexion", {
        description: "Impossible de rejoindre le défi.",
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.disconnect();
      }
      clearTimer();
    };
  }, [id, user, isAuthenticated, isLoading]);

  useEffect(() => {
    console.log("État du défi mis à jour:", {
      current_question_index: challenge?.current_question_index,
      question: shuffledQuestions[challenge?.current_question_index || 0],
    });
  }, [challenge, shuffledQuestions]);

  useEffect(() => {
    if (
      challenge &&
      !isChallengeFinished &&
      timeLeft !== null &&
      shuffledQuestions.length > 0
    ) {
      startTimer();
    }
    return () => clearTimer();
  }, [challenge, timeLeft, isChallengeFinished, shuffledQuestions]);

  const startTimer = () => {
    clearTimer();
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer();
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAnswerClick = async (answerId: number) => {
    if (
      selectedAnswer !== null ||
      challenge?.question_answered_by ||
      !challenge
    )
      return;

    const currentQuestion = shuffledQuestions[challenge.current_question_index];
    setSelectedAnswer(answerId);

    try {
      await api.post(`/challenges/submit/${id}`, {
        question_id: currentQuestion.id,
        answer_id: answerId,
      });
    } catch (error: any) {
      console.error(
        "Erreur lors de la soumission:",
        error.response?.data || error.message
      );
      toast.error("Erreur lors de la soumission de la réponse");
      setSelectedAnswer(null);
    }
  };

  const handleTimeUp = async () => {
    if (!challenge || challenge.question_answered_by) return;

    setSelectedAnswer(-1);
    setTimeout(async () => {
      if (challenge.current_question_index < shuffledQuestions.length - 1) {
        try {
          await api.post(`/challenges/submit/${id}`, {
            question_id: shuffledQuestions[challenge.current_question_index].id,
            answer_id: -1,
          });
        } catch (error: any) {
          console.error(
            "Erreur lors du timeout:",
            error.response?.data || error.message
          );
          toast.error("Erreur lors du passage à la question suivante");
        }
      } else {
        setIsChallengeFinished(true);
      }
      setSelectedAnswer(null);
    }, 1000);
  };

  const handleAbandon = async () => {
    try {
      await api.post(`/challenges/abandon/${id}`);
      toast.success("Vous avez abandonné le défi");
    } catch (error: any) {
      console.error(
        "Erreur lors de l'abandon:",
        error.response?.data || error.message
      );
      toast.error("Erreur lors de l'abandon du défi");
    }
  };

  const handlePublishVictory = async () => {
    if (!challenge || !user) return;
    try {
      const loserPseudo =
        user.id === challenge.player1.id
          ? challenge.player2.pseudo
          : challenge.player1.pseudo;
      await api.post("/posts", {
        content: `J'ai gagné un défi contre ${loserPseudo} avec ${
          challenge.player1_bet +
          challenge.player2_bet +
          (user.id === challenge.player1.id
            ? challenge.player1_score
            : challenge.player2_score)
        } XP !`,
        type: "challenge",
        related_id: challenge.id,
      });
      toast.success("Publié", { description: "Victoire partagée !" });
      setShowVictoryPopup(false);
      window.location.href = "/platform/posts";
    } catch (error: any) {
      console.error(
        "Erreur lors de la publication:",
        error.response?.data || error.message
      );
      toast.error("Erreur lors de la publication de la victoire");
    }
  };

  const handleCancelPost = () => {
    setShowVictoryPopup(false);
    window.location.href = "/platform/challenges";
  };

  if (isLoading || !id)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  if (!isAuthenticated || !user)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Vous devez être connecté.
      </div>
    );
  if (!challenge || shuffledQuestions.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement du défi...
      </div>
    );

  if (isChallengeFinished) {
    const winner =
      challenge.winner_id === challenge.player1_id
        ? challenge.player1.pseudo
        : challenge.winner_id === challenge.player2_id
        ? challenge.player2.pseudo
        : "Aucun gagnant";
    return (
      <>
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold mb-6 text-[hsl(var(--foreground))]">
            Défi Terminé
          </h1>
          <p className="text-xl mb-4">
            Scores : {challenge.player1.pseudo} ({challenge.player1_score}) vs{" "}
            {challenge.player2.pseudo} ({challenge.player2_score})
          </p>
          <p className="text-lg mb-6">Gagnant : {winner}</p>
          {!showVictoryPopup && (
            <Button
              onClick={() => (window.location.href = "/platform/challenges")}
            >
              Retour au lobby
            </Button>
          )}
        </div>
        {showVictoryPopup && (
          <Dialog open={showVictoryPopup} onOpenChange={setShowVictoryPopup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Félicitations, vous avez gagné !</DialogTitle>
              </DialogHeader>
              <p className="text-lg">
                Vous avez gagné{" "}
                {challenge.player1_bet +
                  challenge.player2_bet +
                  (user.id === challenge.player1.id
                    ? challenge.player1_score
                    : challenge.player2_score)}{" "}
                XP !
              </p>
              <p>Voulez-vous partager votre victoire ?</p>
              <div className="flex gap-4 mt-4">
                <Button onClick={handlePublishVictory}>Publier</Button>
                <Button variant="outline" onClick={handleCancelPost}>
                  Annuler
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  const currentQuestion = shuffledQuestions[challenge.current_question_index];
  const progress =
    timeLeft !== null && currentQuestion.time_limit
      ? (timeLeft / currentQuestion.time_limit) * 100
      : 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.5 }}
      className="py-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Défi 1v1 : {challenge.player1.pseudo} vs {challenge.player2.pseudo}
        </h1>
        <p className="text-lg">
          Scores : {challenge.player1.pseudo} - {challenge.player1_score} |{" "}
          {challenge.player2.pseudo} - {challenge.player2_score}
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-lg">
          Question {challenge.current_question_index + 1}/
          {shuffledQuestions.length}
        </p>
        <motion.div
          className="relative w-16 h-16"
          animate={{ rotate: 360 }}
          transition={{
            duration: currentQuestion.time_limit || 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="2"
            />
            <motion.path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="100"
              strokeDashoffset={100 - progress}
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - progress }}
              transition={{ ease: "linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg">
            {timeLeft}
          </span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[hsl(var(--card))] p-6 rounded-lg shadow"
        >
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
          <div className="grid gap-4">
            {currentQuestion.answers.map((answer) => {
              const isSelected = selectedAnswer === answer.id;
              const isCorrect = answer.is_correct;
              const buttonVariant =
                selectedAnswer === null
                  ? "outline"
                  : isSelected && isCorrect
                  ? "default"
                  : isSelected
                  ? "destructive"
                  : challenge.question_answered_by && isCorrect
                  ? "default"
                  : "outline";

              return (
                <Button
                  key={answer.id}
                  variant={buttonVariant}
                  className="w-full justify-start"
                  onClick={() => handleAnswerClick(answer.id)}
                  disabled={
                    selectedAnswer !== null || !!challenge.question_answered_by
                  }
                >
                  {answer.text}
                </Button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <Button
        variant="destructive"
        className="mt-6"
        onClick={handleAbandon}
        disabled={isChallengeFinished}
      >
        Abandonner
      </Button>
    </motion.div>
  );
}
