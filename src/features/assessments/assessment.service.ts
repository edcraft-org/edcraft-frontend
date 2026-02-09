// Assessment service - API calls for assessment management

import { api } from "@/api/client";
import type {
    AssessmentResponse,
    AssessmentWithQuestionsResponse,
    CreateAssessmentRequest,
    InsertQuestionIntoAssessmentRequest,
    LinkQuestionToAssessmentRequest,
    ReorderQuestionsInAssessmentRequest,
    UpdateAssessmentRequest,
} from "@/api/models";

// Get all assessments for a user
export async function getAssessments(
    folderId?: string,
): Promise<AssessmentResponse[]> {
    const response = await api.listAssessmentsAssessmentsGet({
        folder_id: folderId,
    });
    return response.data;
}

// Get a single assessment with all questions
export async function getAssessment(
    assessmentId: string,
): Promise<AssessmentWithQuestionsResponse> {
    const response = await api.getAssessmentAssessmentsAssessmentIdGet(assessmentId);
    return response.data;
}

// Create a new assessment
export async function createAssessment(data: CreateAssessmentRequest): Promise<AssessmentResponse> {
    const response = await api.createAssessmentAssessmentsPost(data);
    return response.data;
}

// Update an assessment
export async function updateAssessment(
    assessmentId: string,
    data: UpdateAssessmentRequest,
): Promise<AssessmentResponse> {
    const response = await api.updateAssessmentAssessmentsAssessmentIdPatch(assessmentId, data);
    return response.data;
}

// Delete an assessment
export async function deleteAssessment(assessmentId: string): Promise<void> {
    const response = await api.softDeleteAssessmentAssessmentsAssessmentIdDelete(assessmentId);
    return response.data;
}

// Add a new question to an assessment
export async function addQuestionToAssessment(
    assessmentId: string,
    data: InsertQuestionIntoAssessmentRequest,
): Promise<AssessmentWithQuestionsResponse> {
    const response = await api.insertQuestionIntoAssessmentAssessmentsAssessmentIdQuestionsPost(
        assessmentId,
        data,
    );
    return response.data;
}

// Link an existing question to an assessment
export async function linkQuestionToAssessment(
    assessmentId: string,
    data: LinkQuestionToAssessmentRequest,
): Promise<AssessmentWithQuestionsResponse> {
    const response = await api.linkQuestionIntoAssessmentAssessmentsAssessmentIdQuestionsLinkPost(
        assessmentId,
        data,
    );
    return response.data;
}

// Remove (unlink) a question from an assessment
export async function removeQuestionFromAssessment(
    assessmentId: string,
    questionId: string,
): Promise<void> {
    const response =
        await api.removeQuestionFromAssessmentAssessmentsAssessmentIdQuestionsQuestionIdDelete(
            assessmentId,
            questionId,
        );
    return response.data;
}

// Reorder questions in an assessment
export async function reorderQuestions(
    assessmentId: string,
    data: ReorderQuestionsInAssessmentRequest,
): Promise<AssessmentWithQuestionsResponse> {
    const response = await api.reorderQuestionsAssessmentsAssessmentIdQuestionsReorderPatch(
        assessmentId,
        data,
    );
    return response.data;
}
