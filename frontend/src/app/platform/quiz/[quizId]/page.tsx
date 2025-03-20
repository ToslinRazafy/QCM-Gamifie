"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Quiz {
  id: number;
  title: string;
  niveau: string;
  description: string | null;
  category: Category;
  questions: Question[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function QuizPage() {
  const { quizId } = useParams();
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [shuffledQuiz, setShuffledQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuiz();
    }
  }, [isAuthenticated, quizId]);

  useEffect(() => {
    if (quiz) {
      const shuffledQuestions = shuffleArray(quiz.questions).map(
        (question) => ({
          ...question,
          answers: shuffleArray(question.answers),
        })
      );
      setShuffledQuiz({ ...quiz, questions: shuffledQuestions });
      setTimeLeft(shuffledQuestions[0].time_limit || 30);
    }
  }, [quiz]);

  useEffect(() => {
    if (shuffledQuiz && !isQuizFinished && timeLeft !== null) {
      startTimer();
    }
    return () => clearTimer();
  }, [shuffledQuiz, currentQuestionIndex, timeLeft, isQuizFinished]);

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      setQuiz(response.data);
    } catch (error) {
      toast.error("Impossible de charger le quiz");
    }
  };

  const startTimer = () => {
    clearTimer();
    if (timeLeft! > 0) {
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
    } else {
      handleTimeUp();
    }
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAnswerClick = (answerId: number) => {
    if (selectedAnswer !== null) return;
    const questionId = shuffledQuiz!.questions[currentQuestionIndex].id;
    setSelectedAnswer(answerId);
    setResponses((prev) => ({ ...prev, [questionId]: answerId }));

    const isCorrect = shuffledQuiz!.questions[
      currentQuestionIndex
    ].answers.find((a) => a.id === answerId)?.is_correct;
    if (isCorrect) {
      if(shuffledQuiz!.niveau === "Facile"){
        setScore((prev) => prev + 10);
      }else if (shuffledQuiz!.niveau === "Moyen") {
        setScore((prev) => prev + 20);
      } else {
        setScore((prev) => prev + 30);
      }
    }

    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      const questionId = shuffledQuiz!.questions[currentQuestionIndex].id;
      setResponses((prev) => ({ ...prev, [questionId]: -1 }));
    }

    handleNextQuestion();

  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuiz!.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(
        shuffledQuiz!.questions[currentQuestionIndex + 1].time_limit || 30
      );
      setSelectedAnswer(null);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    clearTimer();
    try {
      const filteredResponses = Object.fromEntries(
        Object.entries(responses).filter(([_, answerId]) => answerId !== -1)
      );
      const response = await api.post(`/quizzes/${quizId}/submit`, {
        responses: Object.entries(filteredResponses).map(
          ([questionId, answerId]) => ({
            question_id: Number(questionId),
            answer_id: answerId,
          })
        ),
      });
      setIsQuizFinished(true);
      toast.success(
        `Quiz terminé ! Score: ${response.data.score} | XP: ${response.data.xp}`
      );
    } catch (error) {
      toast.error("Erreur lors de la soumission du quiz");
    }
  };

  if (isLoading || !shuffledQuiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  }

  if (isQuizFinished) {
    return (
      <div className="py-6 text-center">
        <h1 className="text-3xl font-bold mb-6 text-[hsl(var(--foreground))]">
          Résultats
        </h1>
        <p className="text-xl mb-4">Score final : {score} points</p>
        <p className="text-lg mb-6">
          Vous avez terminé le quiz "{shuffledQuiz.title}" dans la catégorie "
          {shuffledQuiz.category.name}".
        </p>
        <Button onClick={() => (window.location.href = "/platform")}>
          Retour aux quizzes
        </Button>
      </div>
    );
  }

  const currentQuestion = shuffledQuiz.questions[currentQuestionIndex];
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
          {shuffledQuiz.title}
        </h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))]">
          {shuffledQuiz.description || "Pas de description"}
        </p>
        <p className="text-lg text-[hsl(var(--muted-foreground))]">
          Niveau : {shuffledQuiz.niveau}
        </p>
        <p className="mt-2">
          Catégorie :{" "}
          <span className="font-semibold">{shuffledQuiz.category.name}</span> -{" "}
          {shuffledQuiz.category.description}
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-lg">
          Question {currentQuestionIndex + 1}/{shuffledQuiz.questions.length}
        </p>
        <div className="flex items-center gap-4">
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
          <p>Score : {score}</p>
        </div>
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
                  : isCorrect
                  ? "default"
                  : "outline";

              return (
                <Button
                  key={answer.id}
                  variant={buttonVariant}
                  className="w-full justify-start"
                  onClick={() => handleAnswerClick(answer.id)}
                  disabled={selectedAnswer !== null}
                >
                  {answer.text}
                </Button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
