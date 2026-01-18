// Question Template-related types

import type { BaseEntity } from "@/shared/types/common.types";
import type { QuestionType } from "@/features/questions/types/question.types";

// Target element types from the backend
export type TargetElementType = "function" | "loop" | "branch" | "variable";
export type OutputType = "list" | "count" | "first" | "last";
export type TargetModifier = "arguments" | "return_value" | "loop_iterations" | "branch_true" | "branch_false";

export interface TargetElement {
  type: TargetElementType;
  id: number[];
  name?: string;
  line_number?: number;
  modifier?: TargetModifier;
}

export interface QuestionSpec {
  target: TargetElement[];
  output_type: OutputType;
  question_type: QuestionType;
}

export interface GenerationOptions {
  num_distractors: number;
}

export interface TemplateConfig {
  code: string;
  question_spec: QuestionSpec;
  generation_options: GenerationOptions;
  entry_function: string;
}

export interface QuestionTemplate extends BaseEntity {
  owner_id: string;
  question_type: QuestionType;
  question_text: string;
  description: string | null;
  template_config: TemplateConfig;
}

// Question template with order info (when in an assessment template)
export interface OrderedQuestionTemplate extends QuestionTemplate {
  order: number;
  added_at: string;
}

// Request types
export interface CreateQuestionTemplateRequest {
  owner_id: string;
  question_type: QuestionType;
  question_text: string;
  description?: string;
  template_config: TemplateConfig;
}

export interface UpdateQuestionTemplateRequest {
  question_type?: QuestionType;
  question_text?: string;
  description?: string;
  template_config?: TemplateConfig;
}

// For generating question from template
export interface GenerateFromTemplateRequest {
  input_data: Record<string, unknown>;
}

// Response for template generation preview
export interface GenerateTemplateResponse {
  question_text: string;
  sample_question: {
    text: string;
    answer: unknown;
    options?: unknown[];
    correct_indices?: number[];
    question_type: QuestionType;
  };
  template_config: TemplateConfig;
}
