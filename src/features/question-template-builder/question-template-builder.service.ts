// Question template builder service - API calls for template generation

import { api } from "@/api/client";
import type {
    AssessmentWithQuestionsResponse,
    GenerateAssessmentFromTemplateRequest,
    GenerateQuestionFromTemplateRequest,
    GenerateTemplateRequest,
    Question,
    TemplatePreviewResponse,
} from "@/api/models";

// Generate a template preview (no DB persistence)
export async function generateTemplate(
    data: GenerateTemplateRequest,
): Promise<TemplatePreviewResponse> {
    const response =
        await api.generateTemplatePreviewQuestionGenerationGenerateTemplatePost(data);
    return response.data;
}

// Generate a question from a template (no DB persistence)
export async function generateQuestionFromTemplate(
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

// Generate an assessment from a template (with DB persistence)
export async function generateAssessmentFromTemplate(
    templateId: string,
    data: GenerateAssessmentFromTemplateRequest,
): Promise<AssessmentWithQuestionsResponse> {
    const response =
        await api.generateAssessmentFromTemplateQuestionGenerationAssessmentFromTemplateTemplateIdPost(
            templateId,
            data,
        );
    return response.data;
}
