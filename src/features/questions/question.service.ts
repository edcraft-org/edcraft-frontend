// Question service - API calls for question management

import { api } from "@/api/client";
import type {
  QuestionResponse,
  UpdateQuestionRequest,
  AssessmentResponse,
} from "@/api/models";

// Get all questions for a user
export async function getQuestions(
  ownerId: string,
): Promise<QuestionResponse[]> {
  const response = await api.listQuestionsQuestionsGet({ owner_id: ownerId });
  return response.data;
}

// Get a single question by ID
export async function getQuestion(
  questionId: string,
): Promise<QuestionResponse> {
  const response = await api.getQuestionQuestionsQuestionIdGet(questionId);
  return response.data;
}

// Update a question
export async function updateQuestion(
  questionId: string,
  data: UpdateQuestionRequest,
): Promise<QuestionResponse> {
  const response = await api.updateQuestionQuestionsQuestionIdPatch(questionId, data);
  return response.data;
}

// Delete a question
export async function deleteQuestion(
  questionId: string,
): Promise<void> {
  const response = await api.softDeleteQuestionQuestionsQuestionIdDelete(questionId);
  return response.data;
}

// Get assessments that contain a specific question
export async function getAssessmentsContainingQuestion(
  questionId: string,
  ownerId: string,
): Promise<AssessmentResponse[]> {
  const response = await api.getAssessmentsForQuestionQuestionsQuestionIdAssessmentsGet(
    questionId,
    { owner_id: ownerId }
  );
  return response.data;
}
