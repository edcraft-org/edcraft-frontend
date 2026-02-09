// Assessment Template hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "./assessment-template.service";
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

// Hook to generate an assessment from a template
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
        onSuccess: (newAssessment) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(newAssessment.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newAssessment.folder_id),
            });
        },
    });
}
