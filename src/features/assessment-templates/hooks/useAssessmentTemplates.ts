// Assessment Template hooks using TanStack Query

import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAbortError } from "@/api/pollJob";
import { queryKeys } from "@/api";
import {
    getAssessmentTemplates,
    getAssessmentTemplate,
    createAssessmentTemplate,
    updateAssessmentTemplate,
    deleteAssessmentTemplate,
    addQuestionTemplateToAssessmentTemplate,
    linkQuestionTemplateToAssessmentTemplate,
    removeQuestionTemplateFromAssessmentTemplate,
    reorderQuestionTemplatesInAssessmentTemplate,
    generateAssessmentFromTemplate,
    syncQuestionTemplateInAssessmentTemplate,
    unlinkQuestionTemplateInAssessmentTemplate,
    getSharedAssessmentTemplates,
} from "../services/assessment-template.service";
import type {
    CreateAssessmentTemplateRequest,
    UpdateAssessmentTemplateRequest,
    InsertQuestionTemplateIntoAssessmentTemplateRequest,
    LinkQuestionTemplateToAssessmentTemplateRequest,
    ReorderQuestionTemplatesInAssessmentTemplateRequest,
    GenerateAssessmentFromTemplateRequest,
} from "@/api/models";

// Hook to fetch all assessment templates for a user
export function useAssessmentTemplates(ownerId: string | undefined, folderId?: string) {
    return useQuery({
        queryKey: queryKeys.assessmentTemplates.byFolder(ownerId || "", folderId || ""),
        queryFn: () => getAssessmentTemplates(folderId),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single assessment template
export function useAssessmentTemplate(templateId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.assessmentTemplates.detail(templateId || ""),
        queryFn: () => getAssessmentTemplate(templateId!),
        enabled: !!templateId,
    });
}

// Hook to create an assessment template
export function useCreateAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAssessmentTemplateRequest) => createAssessmentTemplate(data),
        onSuccess: (newTemplate) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.all(newTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newTemplate.folder_id),
            });
        },
    });
}

// Hook to update an assessment template
export function useUpdateAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: UpdateAssessmentTemplateRequest;
            oldFolderId: string;
        }) => updateAssessmentTemplate(templateId, data),
        onSuccess: (updatedTemplate, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.detail(updatedTemplate.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.all(updatedTemplate.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(updatedTemplate.folder_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.oldFolderId),
            });
        },
    });
}

// Hook to delete an assessment template
export function useDeleteAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ templateId }: { templateId: string; ownerId: string; folderId: string }) =>
            deleteAssessmentTemplate(templateId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.folderId),
            });
        },
    });
}

// Hook to add a new question template to an assessment template
export function useAddQuestionTemplateToAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: InsertQuestionTemplateIntoAssessmentTemplateRequest;
        }) => addQuestionTemplateToAssessmentTemplate(templateId, data),
        onSuccess: (updatedTemplate) => {
            queryClient.setQueryData(
                queryKeys.assessmentTemplates.detail(updatedTemplate.id),
                updatedTemplate,
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplates.all(updatedTemplate.owner_id),
            });
        },
    });
}

// Hook to link an existing question template to an assessment template
export function useLinkQuestionTemplateToAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: LinkQuestionTemplateToAssessmentTemplateRequest;
        }) => linkQuestionTemplateToAssessmentTemplate(templateId, data),
        onSuccess: (updatedTemplate) => {
            queryClient.setQueryData(
                queryKeys.assessmentTemplates.detail(updatedTemplate.id),
                updatedTemplate,
            );
        },
    });
}

// Hook to remove a question template from an assessment template
export function useRemoveQuestionTemplateFromAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            questionTemplateId,
        }: {
            templateId: string;
            questionTemplateId: string;
        }) => removeQuestionTemplateFromAssessmentTemplate(templateId, questionTemplateId),
        onSuccess: (_, { templateId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessmentTemplates.detail(templateId),
            });
        },
    });
}

// Hook to reorder question templates with optimistic updates
export function useReorderQuestionTemplatesInAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: ReorderQuestionTemplatesInAssessmentTemplateRequest;
        }) => reorderQuestionTemplatesInAssessmentTemplate(templateId, data),
        onSuccess: (updatedTemplate) => {
            queryClient.setQueryData(
                queryKeys.assessmentTemplates.detail(updatedTemplate.id),
                updatedTemplate,
            );
        },
    });
}

// Hook to sync a linked question template's content from its source
export function useSyncQuestionTemplateInAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            questionTemplateId,
        }: {
            templateId: string;
            questionTemplateId: string;
        }) => syncQuestionTemplateInAssessmentTemplate(templateId, questionTemplateId),
        onSuccess: (updatedTemplate) => {
            queryClient.setQueryData(
                queryKeys.assessmentTemplates.detail(updatedTemplate.id),
                updatedTemplate,
            );
        },
    });
}

// Hook to sever the source link on a question template (making it fully independent)
export function useUnlinkQuestionTemplateInAssessmentTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateId,
            questionTemplateId,
        }: {
            templateId: string;
            questionTemplateId: string;
        }) => unlinkQuestionTemplateInAssessmentTemplate(templateId, questionTemplateId),
        onSuccess: (updatedTemplate) => {
            queryClient.setQueryData(
                queryKeys.assessmentTemplates.detail(updatedTemplate.id),
                updatedTemplate,
            );
        },
    });
}

// Hook to generate an assessment from a template
export function useGenerateAssessmentFromTemplate() {
    const queryClient = useQueryClient();
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateAssessmentFromTemplateRequest;
        }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return generateAssessmentFromTemplate(templateId, data, controller.signal);
        },
        onError: (error) => { if (isAbortError(error)) return; },
        onSuccess: (newAssessment) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(newAssessment.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newAssessment.folder_id),
            });
        },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}

// Hook to fetch assessment templates shared with the current user
export function useSharedAssessmentTemplates(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.sharedResources.byResourcePath("assessment-templates"),
        queryFn: getSharedAssessmentTemplates,
        enabled,
    });
}
