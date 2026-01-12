
export enum Category {
  RIPEAM = 'RIPEAM',
  BALIZAMENTO = 'Balizamento (IALA B)',
  INCENDIO = 'Combate a Incêndio',
  SOBREVIVENCA = 'Sobrevivência e Salvatagem',
  MANOBRA = 'Manobra e Marinharia',
  NAVEGACAO = 'Navegação e Cartas',
  PRIMEIROS_SOCORROS = 'Primeiros Socorros'
}

export type FeedbackMode = 'immediate' | 'delayed';

export interface Question {
  id: string;
  category: Category;
  text: string;
  options: string[];
  correctAnswer: number; // Index of options array
  explanation?: string;
  image?: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: (number | null)[];
  isFinished: boolean;
  score: number;
  feedbackMode: FeedbackMode;
}

export interface QuizRun {
  date: string;
  score: number;
  total: number;
  categoryScores: Record<string, { correct: number; total: number }>;
}

export interface UserStats {
  totalSimulations: number;
  bestScore: number;
  averagePercentage: number;
  history: QuizRun[];
}
