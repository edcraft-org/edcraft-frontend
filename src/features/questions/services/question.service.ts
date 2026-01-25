// Question service - API calls for question management

import { apiClient } from "@/shared/services/api-client";
import type {
  QuestionResponse as Question,
  QuestionUpdate as UpdateQuestionRequest,
  AssessmentResponse as Assessment,
} from "@/generated";

// Get all questions for a user
export async function getQuestions(
  ownerId: string,
  signal?: AbortSignal
): Promise<Question[]> {
  return apiClient.get<Question[]>(`/questions?owner_id=${ownerId}`, signal);
}

// Get a single question by ID
export async function getQuestion(
  questionId: string,
  signal?: AbortSignal
): Promise<Question> {
  return apiClient.get<Question>(`/questions/${questionId}`, signal);
}

// Update a question
export async function updateQuestion(
  questionId: string,
  data: UpdateQuestionRequest,
  signal?: AbortSignal
): Promise<Question> {
  return apiClient.patch<Question>(`/questions/${questionId}`, data, signal);
}

// Delete a question (soft delete)
export async function deleteQuestion(
  questionId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(`/questions/${questionId}`, signal);
}

// Get assessments that contain a specific question (for delete warning)
export async function getQuestionAssessments(
  questionId: string,
  ownerId: string,
  signal?: AbortSignal
): Promise<Assessment[]> {
  return apiClient.get<Assessment[]>(
    `/questions/${questionId}/assessments?owner_id=${ownerId}`,
    signal
  );
}
