// Template service - API calls for question template management

import { api } from "@/api/client";
import type {
    GenerateQuestionFromTemplateRequest,
    Question,
    QuestionTemplateResponse,
    QuestionTemplateSummaryResponse,
    QuestionTemplateUsageResponse,
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

// Get usage information for a question template
export async function getQuestionTemplateUsage(
    templateId: string,
): Promise<QuestionTemplateUsageResponse> {
    const response =
        await api.getQuestionTemplateUsageQuestionTemplatesQuestionTemplateIdUsageGet(templateId);
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
