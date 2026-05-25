export interface Question {
  id: number;
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correct_answers: number[];
  explanation: string;
  error_count: number;
  correct_count: number;
  weight: number;
  is_marked: boolean;
  created_at: string;
}

export interface QuestionDraft {
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}
