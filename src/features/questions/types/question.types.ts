// Question-related types

import type { BaseEntity } from "@/shared/types/common.types";

export type QuestionType = "mcq" | "mrq" | "short_answer";

// Additional data structure varies by question type
export interface MCQAdditionalData {
  options: string[];
  correct_indices: number[];
  answer: string;
}

export interface ShortAnswerAdditionalData {
  answer: string;
}

export type QuestionAdditionalData = MCQAdditionalData | ShortAnswerAdditionalData;

export interface Question extends BaseEntity {
  owner_id: string;
  template_id: string | null;
  question_type: QuestionType;
  question_text: string;
  additional_data: QuestionAdditionalData;
}

// Question with order info (when in an assessment)
export interface OrderedQuestion extends Question {
  order: number;
  added_at: string;
}

// Request types
export interface CreateQuestionRequest {
  owner_id: string;
  template_id?: string | null;
  question_type: QuestionType;
  question_text: string;
  additional_data: QuestionAdditionalData;
}

export interface UpdateQuestionRequest {
  question_type?: QuestionType;
  question_text?: string;
  additional_data?: QuestionAdditionalData;
}

// For adding question to assessment
export interface AddQuestionToAssessmentRequest {
  question: CreateQuestionRequest;
  order?: number;
}

export interface LinkQuestionRequest {
  question_id: string;
  order?: number;
}

export interface ReorderQuestionsRequest {
  question_orders: Array<{
    question_id: string;
    order: number;
  }>;
}
