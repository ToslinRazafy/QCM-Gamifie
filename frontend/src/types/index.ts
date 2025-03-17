export interface User {
  id: string;
  pseudo: string; // Remplace par "pseudo" si c'est ce que ton backend renvoie
  email: string;
  firstname: string;
  lastname: string | null;
  country: string | null;
  xp: number;
  league: string;
  duel_wins: number;
  status: string;
  is_active: boolean;
  role: "ADMIN" | "USER";
  history: History[]; // Ajouté
  badges: Badge[]; // Ajouté
  challenges_as_player1: Challenge[]; // Ajouté, snake_case pour correspondre à Laravel
  challenges_as_player2: Challenge[]; // Ajouté
  won_challenges: Challenge[]; // Ajouté
}

export interface Category {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  user_id: string;
  category_id: number;
  description: string | null;
  questions: Question[];
  category?: Category;
}

export interface Question {
  id: number;
  quiz_id: number;
  text: string;
  answers: Answer[];
}

export interface Answer {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
}

export interface Challenge {
  id: number;
  quiz_id: number;
  player1_id: string;
  player2_id: string;
  status: "pending" | "active" | "completed";
  player1_score: number | null;
  player2_score: number | null;
  player1_bet: number;
  player2_bet: number;
  winner_id: string | null;
  player1: User;
  quiz: Quiz;
}

export interface Badge {
  id: number;
  name: string;
  description: string | null;
  condition: string | null;
  pivot?: {
    earned_at: string;
  };
}

export interface History {
  id: number;
  user_id: string;
  type: "xp" | "badge" | "quiz" | "challenge" | "league";
  description: string;
  value: number | null;
  created_at: string;
}

export interface Friend {
  id: number;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted";
  friend: User;
}

export interface Post {
  id: number;
  user_id: string;
  content: string;
  type: "challenge" | "badge" | "league";
  related_id: number | null;
  user: User;
  likes: Like[];
  comments: Comment[];
}

export interface Like {
  id: number;
  user_id: string;
  post_id: number;
}

export interface Comment {
  id: number;
  user_id: string;
  post_id: number;
  content: string;
  user: User;
}

export interface Stats {
  total_users: number;
  active_users: number;
  total_quizzes: number;
  total_challenges: number;
}
