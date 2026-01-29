// Question hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    getAssessmentsContainingQuestion,
} from "./question.service";
import type { UpdateQuestionRequest } from "@/api/models/updateQuestionRequest";

// Hook to fetch all questions for a user
export function useQuestions(ownerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questions.all(ownerId ?? ""),
        queryFn: () => getQuestions(ownerId!),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single question
export function useQuestion(questionId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questions.detail(questionId ?? ""),
        queryFn: () => getQuestion(questionId!),
        enabled: !!questionId,
    });
}

// Hook to fetch assessments that contain a question
export function useQuestionAssessments(
    questionId: string | undefined,
    ownerId: string | undefined,
) {
    return useQuery({
        queryKey: queryKeys.questions.assessments(questionId ?? ""),
        queryFn: () => getAssessmentsContainingQuestion(questionId!, ownerId!),
        enabled: !!questionId && !!ownerId,
    });
}

// Hook to update a question
export function useUpdateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ questionId, data }: { questionId: string; data: UpdateQuestionRequest }) =>
            updateQuestion(questionId, data),
        onSuccess: (updatedQuestion) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questions.detail(updatedQuestion.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questions.all(updatedQuestion.owner_id),
            });
            // Invalidate assessments owned by the same owner as these assessments may include the updated question
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(updatedQuestion.owner_id),
            });
        },
    });
}

// Hook to delete a question
export function useDeleteQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ questionId }: { questionId: string; ownerId: string }) =>
            deleteQuestion(questionId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questions.all(variables.ownerId),
            });
            // Invalidate assessments owned by the same owner as these assessments may include the updated question
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(variables.ownerId),
            });
        },
    });
}
