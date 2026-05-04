// Question Template hooks

import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAbortError } from "@/api/pollJob";
import { queryKeys } from "@/api";
import {
    getQuestionTemplates,
    getQuestionTemplate,
    updateQuestionTemplate,
    deleteQuestionTemplate,
    generateFromTemplate,
} from "../services/question-template.service";
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
                queryKey: ["assessment-templates", "detail"],
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(updatedTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.allDetails(),
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
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateQuestionFromTemplateRequest;
        }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return generateFromTemplate(templateId, data, controller.signal);
        },
        onError: (error) => { if (isAbortError(error)) return; },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}
