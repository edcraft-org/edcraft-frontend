// Template service - API calls for question template management

import { api } from "@/api/client";
import type {
    AssessmentTemplateResponse,
    GenerateQuestionFromTemplateRequest,
    Question,
    QuestionTemplateResponse,
    QuestionTemplateSummaryResponse,
    UpdateQuestionTemplateRequest,
} from "@/api/models";

// Get all question templates for a user
export async function getQuestionTemplates(): Promise<QuestionTemplateSummaryResponse[]> {
    const response = await api.listQuestionTemplatesQuestionTemplatesGet();
    return response.data;
}

// Get a single question template by ID
export async function getQuestionTemplate(templateId: string): Promise<QuestionTemplateResponse> {
    const response = await api.getQuestionTemplateQuestionTemplatesTemplateIdGet(templateId);
    return response.data;
}

// Update a question template
export async function updateQuestionTemplate(
    templateId: string,
    data: UpdateQuestionTemplateRequest,
): Promise<QuestionTemplateResponse> {
    const response = await api.updateQuestionTemplateQuestionTemplatesTemplateIdPatch(
        templateId,
        data,
    );
    return response.data;
}

// Delete a question template
export async function deleteQuestionTemplate(templateId: string): Promise<void> {
    const response =
        await api.softDeleteQuestionTemplateQuestionTemplatesTemplateIdDelete(templateId);
    return response.data;
}

// Get assessment templates that contain a specific question template
export async function getQuestionTemplateAssessmentTemplates(
    templateId: string,
): Promise<AssessmentTemplateResponse[]> {
    const response =
        await api.getAssessmentTemplatesForQuestionTemplateQuestionTemplatesQuestionTemplateIdAssessmentTemplatesGet(
            templateId,
        );
    return response.data;
}

// Generate a question from a question template
export async function generateFromTemplate(
    templateId: string,
    data: GenerateQuestionFromTemplateRequest,
): Promise<Question> {
    const response =
        await api.generateQuestionFromTemplateQuestionGenerationFromTemplateTemplateIdPost(
            templateId,
            data,
        );
    return response.data;
}
