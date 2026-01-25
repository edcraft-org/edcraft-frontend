// Template service - API calls for question template management

import { apiClient } from "@/shared/services/api-client";
import type {
  QuestionTemplateResponse as QuestionTemplate,
  QuestionTemplateCreate as CreateQuestionTemplateRequest,
  QuestionTemplateUpdate as UpdateQuestionTemplateRequest,
  AssessmentTemplateResponse as AssessmentTemplate,
  QuestionSpec,
  GenerationOptions,
  QuestionSpecQuestionType as QuestionType,
} from "@/generated";

// Get all question templates for a user
export async function getQuestionTemplates(
  ownerId: string,
  signal?: AbortSignal
): Promise<QuestionTemplate[]> {
  return apiClient.get<QuestionTemplate[]>(
    `/question-templates?owner_id=${ownerId}`,
    signal
  );
}

// Get a single question template by ID
export async function getQuestionTemplate(
  templateId: string,
  signal?: AbortSignal
): Promise<QuestionTemplate> {
  return apiClient.get<QuestionTemplate>(
    `/question-templates/${templateId}`,
    signal
  );
}

// Create a new question template
export async function createQuestionTemplate(
  data: CreateQuestionTemplateRequest,
  signal?: AbortSignal
): Promise<QuestionTemplate> {
  return apiClient.post<QuestionTemplate>("/question-templates", data, signal);
}

// Update a question template
export async function updateQuestionTemplate(
  templateId: string,
  data: UpdateQuestionTemplateRequest,
  signal?: AbortSignal
): Promise<QuestionTemplate> {
  return apiClient.patch<QuestionTemplate>(
    `/question-templates/${templateId}`,
    data,
    signal
  );
}

// Delete a question template (soft delete)
export async function deleteQuestionTemplate(
  templateId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(`/question-templates/${templateId}`, signal);
}

// Get assessment templates that contain a specific question template (for delete warning)
export async function getQuestionTemplateAssessmentTemplates(
  templateId: string,
  ownerId: string,
  signal?: AbortSignal
): Promise<AssessmentTemplate[]> {
  return apiClient.get<AssessmentTemplate[]>(
    `/question-templates/${templateId}/assessment-templates?owner_id=${ownerId}`,
    signal
  );
}

// Generate a template preview
export interface GenerateTemplatePreviewRequest {
  code: string;
  entry_function: string;
  question_spec: QuestionSpec;
  generation_options: GenerationOptions;
}

export interface GenerateTemplatePreviewResponse {
  question_text: string;
  question_type: string;
  template_config: {
    code: string;
    entry_function: string;
    question_spec: QuestionSpec;
    generation_options: GenerationOptions;
  };
  preview_question: {
    text: string;
    question_type: string;
    answer: string;
    options?: string[];
    correct_indices?: number[];
  };
}

export async function generateTemplatePreview(
  data: GenerateTemplatePreviewRequest,
  signal?: AbortSignal
): Promise<GenerateTemplatePreviewResponse> {
  return apiClient.post<GenerateTemplatePreviewResponse>(
    "/question-generation/generate-template",
    data,
    signal
  );
}

// Generate a question from a template
export interface GenerateFromTemplateRequest {
  input_data: Record<string, unknown>;
}

export interface GeneratedQuestion {
  text: string;
  answer: unknown;
  options?: unknown[];
  correct_indices?: number[];
  question_type: QuestionType;
}

export async function generateFromTemplate(
  templateId: string,
  data: GenerateFromTemplateRequest,
  signal?: AbortSignal
): Promise<GeneratedQuestion> {
  return apiClient.post<GeneratedQuestion>(
    `/question-generation/from-template/${templateId}`,
    data,
    signal
  );
}
