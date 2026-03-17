// Assessment hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getAssessments,
    getAssessment,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    addQuestionToAssessment,
    linkQuestionToAssessment,
    removeQuestionFromAssessment,
    reorderQuestions,
    getSharedAssessments,
    listCollaborators,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
} from "./assessment.service";
import type {
    CollaboratorRole,
    CreateAssessmentRequest,
    InsertQuestionIntoAssessmentRequest,
    LinkQuestionToAssessmentRequest,
    ReorderQuestionsInAssessmentRequest,
    UpdateAssessmentRequest,
} from "@/api/models";

// Hook to fetch all assessments for a user
export function useAssessments(ownerId: string | undefined, folderId?: string) {
    return useQuery({
        queryKey: queryKeys.assessments.byFolder(ownerId || "", folderId || ""),
        queryFn: () => getAssessments(folderId),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single assessment with questions
export function useAssessment(assessmentId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.assessments.detail(assessmentId || ""),
        queryFn: () => getAssessment(assessmentId!),
        enabled: !!assessmentId,
    });
}

// Hook to create an assessment
export function useCreateAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAssessmentRequest) => createAssessment(data),
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

// Hook to update an assessment
export function useUpdateAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            data,
        }: {
            assessmentId: string;
            data: UpdateAssessmentRequest;
            oldFolderId: string;
        }) => updateAssessment(assessmentId, data),
        onSuccess: (updatedAssessment, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.detail(updatedAssessment.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(updatedAssessment.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(updatedAssessment.folder_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.oldFolderId),
            });
        },
    });
}

// Hook to delete an assessment
export function useDeleteAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
        }: {
            assessmentId: string;
            ownerId: string;
            folderId: string;
        }) => deleteAssessment(assessmentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.folderId),
            });
        },
    });
}

// Hook to add a new question to an assessment
export function useAddQuestionToAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            data,
        }: {
            assessmentId: string;
            data: InsertQuestionIntoAssessmentRequest;
        }) => addQuestionToAssessment(assessmentId, data),
        onSuccess: (updatedAssessment) => {
            queryClient.setQueryData(
                queryKeys.assessments.detail(updatedAssessment.id),
                updatedAssessment,
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.questions.all(updatedAssessment.owner_id),
            });
        },
    });
}

// Hook to link an existing question to an assessment
export function useLinkQuestionToAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            data,
        }: {
            assessmentId: string;
            data: LinkQuestionToAssessmentRequest;
        }) => linkQuestionToAssessment(assessmentId, data),
        onSuccess: (updatedAssessment) => {
            queryClient.setQueryData(
                queryKeys.assessments.detail(updatedAssessment.id),
                updatedAssessment,
            );
        },
    });
}

// Hook to remove a question from an assessment
export function useRemoveQuestionFromAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assessmentId, questionId }: { assessmentId: string; questionId: string }) =>
            removeQuestionFromAssessment(assessmentId, questionId),
        onSuccess: (_, { assessmentId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.detail(assessmentId),
            });
        },
    });
}

// Hook to reorder questions with optimistic updates
export function useReorderQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            data,
        }: {
            assessmentId: string;
            data: ReorderQuestionsInAssessmentRequest;
        }) => reorderQuestions(assessmentId, data),
        onSuccess: (updatedAssessment) => {
            queryClient.setQueryData(
                queryKeys.assessments.detail(updatedAssessment.id),
                updatedAssessment,
            );
        },
    });
}

// Hook to fetch assessments shared with the current user
export function useSharedAssessments() {
    return useQuery({
        queryKey: queryKeys.sharedResources.all(),
        queryFn: getSharedAssessments,
    });
}

// Hook to list collaborators for an assessment (only enabled for editor/owner)
export function useCollaborators(assessmentId: string | undefined, enabled: boolean) {
    return useQuery({
        queryKey: queryKeys.collaborators.byAssessment(assessmentId || ""),
        queryFn: () => listCollaborators(assessmentId!),
        enabled: !!assessmentId && enabled,
    });
}

// Hook to add a collaborator by email
export function useAddCollaborator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            email,
            role,
        }: {
            assessmentId: string;
            email: string;
            role: CollaboratorRole;
        }) => addCollaborator(assessmentId, email, role),
        onSuccess: (_, { assessmentId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byAssessment(assessmentId),
            });
        },
    });
}

// Hook to update a collaborator's role
export function useUpdateCollaboratorRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            collaboratorId,
            role,
        }: {
            assessmentId: string;
            collaboratorId: string;
            role: CollaboratorRole;
        }) => updateCollaboratorRole(assessmentId, collaboratorId, role),
        onSuccess: (_, { assessmentId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byAssessment(assessmentId),
            });
            // Ownership transfer changes my_role — invalidate assessment detail too
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.detail(assessmentId),
            });
        },
    });
}

// Hook to remove a collaborator
export function useRemoveCollaborator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assessmentId,
            collaboratorId,
        }: {
            assessmentId: string;
            collaboratorId: string;
        }) => removeCollaborator(assessmentId, collaboratorId),
        onSuccess: (_, { assessmentId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byAssessment(assessmentId),
            });
        },
    });
}
