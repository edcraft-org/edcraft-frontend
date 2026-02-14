// Question hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionUsage,
} from "./question.service";
import type { UpdateQuestionRequest } from "@/api/models/updateQuestionRequest";

// Hook to fetch all questions for a user
export function useQuestions(ownerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questions.all(ownerId ?? ""),
        queryFn: () => getQuestions(),
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

// Hook to fetch usage information for a question
export function useQuestionUsage(questionId: string | undefined, ownerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questions.usage(questionId ?? ""),
        queryFn: () => getQuestionUsage(questionId!),
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
            // Invalidate all assessment lists and details as they may include the updated question
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(updatedQuestion.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.allDetails(),
            });
            // Invalidate all question bank lists and details as they may include the updated question
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.all(updatedQuestion.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.allDetails(),
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
            // Invalidate all assessment lists and details as they may include the deleted question
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.allDetails(),
            });
            // Invalidate all question bank lists and details as they may include the deleted question
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.allDetails(),
            });
        },
    });
}
