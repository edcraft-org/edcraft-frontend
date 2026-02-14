// Question service - API calls for question management

import { api } from "@/api/client";
import type { UpdateQuestionRequest, QuestionUsageResponse } from "@/api/models";
import type { QuestionResponse } from "@/types/frontend.types";

// Get all questions for a user
export async function getQuestions(): Promise<QuestionResponse[]> {
    const response = await api.listQuestionsQuestionsGet();
    return response.data;
}

// Get a single question by ID
export async function getQuestion(questionId: string): Promise<QuestionResponse> {
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
export async function deleteQuestion(questionId: string): Promise<void> {
    const response = await api.softDeleteQuestionQuestionsQuestionIdDelete(questionId);
    return response.data;
}

// Get usage information for a question
export async function getQuestionUsage(
    questionId: string,
): Promise<QuestionUsageResponse> {
    const response = await api.getQuestionUsageQuestionsQuestionIdUsageGet(questionId);
    return response.data;
}
