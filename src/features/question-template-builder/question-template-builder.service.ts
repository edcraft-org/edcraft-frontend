// Question template builder service - API calls for template generation

import { api } from "@/api/client";
import { pollJob } from "@/api/pollJob";
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
    signal?: AbortSignal,
): Promise<TemplatePreviewResponse> {
    const response = await api.generateTemplatePreviewQuestionGenerationGenerateTemplatePost(data);
    return pollJob<TemplatePreviewResponse>(response.data.job_id, { signal });
}

// Generate a question from a template (no DB persistence)
export async function generateQuestionFromTemplate(
    templateId: string,
    data: GenerateQuestionFromTemplateRequest,
    signal?: AbortSignal,
): Promise<Question> {
    const response =
        await api.generateQuestionFromTemplateQuestionGenerationFromTemplateTemplateIdPost(
            templateId,
            data,
        );
    return pollJob<Question>(response.data.job_id, { signal });
}

// Generate an assessment from a template (with DB persistence)
export async function generateAssessmentFromTemplate(
    templateId: string,
    data: GenerateAssessmentFromTemplateRequest,
    signal?: AbortSignal,
): Promise<AssessmentWithQuestionsResponse> {
    const response =
        await api.generateAssessmentFromTemplateQuestionGenerationAssessmentFromTemplateTemplateIdPost(
            templateId,
            data,
        );
    return pollJob<AssessmentWithQuestionsResponse>(response.data.job_id, { signal });
}
