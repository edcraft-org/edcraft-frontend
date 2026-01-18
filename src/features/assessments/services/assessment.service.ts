// Assessment service - API calls for assessment management

import { apiClient } from "@/shared/services/api-client";
import type {
  Assessment,
  AssessmentWithQuestions,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "../types/assessment.types";
import type {
  AddQuestionToAssessmentRequest,
  LinkQuestionRequest,
  ReorderQuestionsRequest,
} from "@/features/questions/types/question.types";

// Get all assessments for a user
export async function getAssessments(
  ownerId: string,
  folderId?: string,
  signal?: AbortSignal
): Promise<Assessment[]> {
  let url = `/assessments?owner_id=${ownerId}`;
  if (folderId) {
    url += `&folder_id=${folderId}`;
  }
  return apiClient.get<Assessment[]>(url, signal);
}

// Get a single assessment with all questions
export async function getAssessment(
  assessmentId: string,
  signal?: AbortSignal
): Promise<AssessmentWithQuestions> {
  return apiClient.get<AssessmentWithQuestions>(
    `/assessments/${assessmentId}`,
    signal
  );
}

// Create a new assessment
export async function createAssessment(
  data: CreateAssessmentRequest,
  signal?: AbortSignal
): Promise<Assessment> {
  return apiClient.post<Assessment>("/assessments", data, signal);
}

// Update an assessment
export async function updateAssessment(
  assessmentId: string,
  data: UpdateAssessmentRequest,
  signal?: AbortSignal
): Promise<Assessment> {
  return apiClient.patch<Assessment>(
    `/assessments/${assessmentId}`,
    data,
    signal
  );
}

// Delete an assessment (soft delete)
export async function deleteAssessment(
  assessmentId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(`/assessments/${assessmentId}`, signal);
}

// Add a new question to an assessment (creates the question)
export async function addQuestionToAssessment(
  assessmentId: string,
  data: AddQuestionToAssessmentRequest,
  signal?: AbortSignal
): Promise<AssessmentWithQuestions> {
  return apiClient.post<AssessmentWithQuestions>(
    `/assessments/${assessmentId}/questions`,
    data,
    signal
  );
}

// Link an existing question to an assessment
export async function linkQuestionToAssessment(
  assessmentId: string,
  data: LinkQuestionRequest,
  signal?: AbortSignal
): Promise<AssessmentWithQuestions> {
  return apiClient.post<AssessmentWithQuestions>(
    `/assessments/${assessmentId}/questions/link`,
    data,
    signal
  );
}

// Remove a question from an assessment (does not delete the question)
export async function removeQuestionFromAssessment(
  assessmentId: string,
  questionId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(
    `/assessments/${assessmentId}/questions/${questionId}`,
    signal
  );
}

// Reorder questions in an assessment
export async function reorderQuestions(
  assessmentId: string,
  data: ReorderQuestionsRequest,
  signal?: AbortSignal
): Promise<AssessmentWithQuestions> {
  return apiClient.patch<AssessmentWithQuestions>(
    `/assessments/${assessmentId}/questions/reorder`,
    data,
    signal
  );
}
