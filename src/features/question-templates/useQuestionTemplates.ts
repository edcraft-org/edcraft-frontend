// Question Template hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getQuestionTemplates,
    getQuestionTemplate,
    updateQuestionTemplate,
    deleteQuestionTemplate,
    getQuestionTemplateUsage,
    generateFromTemplate,
} from "./question-template.service";
import type {
    GenerateQuestionFromTemplateRequest,
    UpdateQuestionTemplateRequest,
} from "@/api/models";

// Hook to fetch all question templates for a user
export function useQuestionTemplates(ownerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questionTemplates.all(ownerId ?? ""),
        queryFn: () => getQuestionTemplates(),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single question template
export function useQuestionTemplate(templateId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questionTemplates.detail(templateId ?? ""),
        queryFn: () => getQuestionTemplate(templateId!),
        enabled: !!templateId,
    });
}

// Hook to fetch usage information for a question template
export function useQuestionTemplateUsage(
    templateId: string | undefined,
    ownerId: string | undefined,
) {
    return useQuery({
        queryKey: queryKeys.questionTemplates.usage(templateId ?? ""),
        queryFn: () => getQuestionTemplateUsage(templateId!),
        enabled: !!templateId && !!ownerId,
    });
}

// Hook to update a question template
export function useUpdateQuestionTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: UpdateQuestionTemplateRequest;
        }) => updateQuestionTemplate(templateId, data),
        onSuccess: (updatedTemplate) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplates.detail(updatedTemplate.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplates.all(updatedTemplate.owner_id),
            });
            // Invalidate resources owned by the same owner as these may contain the updated template
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.all(updatedTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.detail(updatedTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(updatedTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.detail(updatedTemplate.owner_id),
            });
        },
    });
}

// Hook to delete a question template
export function useDeleteQuestionTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ templateId }: { templateId: string; ownerId: string }) =>
            deleteQuestionTemplate(templateId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplates.all(variables.ownerId),
            });
            // Invalidate assessment templates owned by the same owner as these may contain the deleted template
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.detail(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.detail(variables.ownerId),
            });
        },
    });
}

// Hook to generate a question from a template
export function useGenerateFromTemplate() {
    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateQuestionFromTemplateRequest;
        }) => generateFromTemplate(templateId, data),
    });
}
