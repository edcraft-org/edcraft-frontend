/**
 * Frontend-specific types and re-exports from generated API types
 * This file combines:
 * 1. Frontend-only types (for UI state management)
 * 2. Re-exports of generated types with convenient aliases
 */

// Import types needed for use in this file's definitions
import type { TargetElementType } from "@/generated";

// Re-export all commonly used generated types
export type {
  TargetElementType,
  CodeInfo,
  CodeTree,
  FormElement,
  FormOption,
  FunctionElement,
  LoopElement,
  BranchElement,
  TargetElement,
  QuestionSpec,
  GenerationOptions,
} from "@/generated";

// Type aliases for backward compatibility
export type { CodeAnalysisResponse as FormSchema } from "@/generated";
export type { QuestionGenerationRequest as GenerateQuestionRequest } from "@/generated";
export type { Question as GenerateQuestionResponse } from "@/generated";
export type { QuestionSpecQuestionType as QuestionType } from "@/generated";
export type { QuestionSpecOutputType as OutputType } from "@/generated";
export type { AssessmentResponse as Assessment } from "@/generated";
export type { AssessmentQuestionResponse as OrderedQuestion } from "@/generated";
export type { AssessmentTemplateResponse as AssessmentTemplate } from "@/generated";
export type { AssessmentTemplateQuestionTemplateResponse as OrderedQuestionTemplate } from "@/generated";
export type { QuestionTemplateResponse as QuestionTemplate } from "@/generated";
export type { AssessmentTemplateWithQuestionTemplates as AssessmentTemplateWithTemplates } from "@/generated";
export type { QuestionResponse as Question } from "@/generated";
export type { FolderResponse as Folder } from "@/generated";
export type { FolderWithContents as FolderContents } from "@/generated";
export type { FolderPath } from "@/generated";
// Frontend-specific types for additional_data based on question type
// Since additional_data is { [key: string]: unknown } in the generated types,
// we define the actual structures here for type safety
export interface MCQAdditionalData {
  options: string[];
  correct_indices: number[];
  answer?: string;
}

export interface ShortAnswerAdditionalData {
  answer: string;
}

/**
 * Modifier types for target elements (frontend-only)
 */
export type Modifier =
  | 'arguments'
  | 'return_value'
  | 'loop_iterations'
  | 'branch_true'
  | 'branch_false';

/**
 * Frontend representation of a scope path item (for UI navigation)
 * This is used internally in the UI and gets transformed to TargetElement[] for API calls
 */
export interface ScopePathItem {
  type: TargetElementType;
  id: number;
  name?: string;
  line_number?: number;
  modifier?: Modifier | null;
  condition?: string;
}

/**
 * Frontend representation of target selection state (before transformation to API format)
 * This is used internally in the UI and gets transformed to TargetElement[] for API calls
 */
export interface TargetSelection {
  type: TargetElementType;
  element_id: number | number[];
  name?: string;
  line_number?: number;
  scope_path: ScopePathItem[];
  modifier?: Modifier | null;
}
