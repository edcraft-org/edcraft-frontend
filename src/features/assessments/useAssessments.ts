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
} from "./assessment.service";
import type {
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
        queryFn: () => getAssessments(ownerId!, folderId),
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
