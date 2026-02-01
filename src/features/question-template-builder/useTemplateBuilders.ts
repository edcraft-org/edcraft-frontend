// Question Template Builder hooks

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    generateTemplate,
    generateQuestionFromTemplate,
    generateAssessmentFromTemplate,
} from "./question-template-builder.service";
import type {
    GenerateTemplateRequest,
    GenerateQuestionFromTemplateRequest,
    GenerateAssessmentFromTemplateRequest,
} from "@/api/models";

// Hook to generate a template preview (no DB persistence)
export function useGenerateTemplatePreview() {
    return useMutation({
        mutationFn: (data: GenerateTemplateRequest) => generateTemplate(data),
    });
}

// Hook to generate a question from a template (no DB persistence)
export function useGenerateQuestionFromTemplate() {
    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateQuestionFromTemplateRequest;
        }) => generateQuestionFromTemplate(templateId, data),
    });
}

// Hook to generate an assessment from a template (with DB persistence)
export function useGenerateAssessmentFromTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateAssessmentFromTemplateRequest;
        }) => generateAssessmentFromTemplate(templateId, data),
        onSuccess: (createdAssessment) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(createdAssessment.owner_id),
            });
        },
    });
}
