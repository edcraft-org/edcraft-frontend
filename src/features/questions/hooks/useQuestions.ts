// Question hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
import {
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionAssessments,
} from "../services/question.service";
import type { QuestionUpdate as UpdateQuestionRequest } from "@/generated";

// Hook to fetch all questions for a user
export function useQuestions(ownerId: string | null) {
  return useQuery({
    queryKey: queryKeys.questions.all(ownerId || ""),
    queryFn: ({ signal }) => getQuestions(ownerId!, signal),
    enabled: !!ownerId,
  });
}

// Hook to fetch a single question
export function useQuestion(questionId: string | null) {
  return useQuery({
    queryKey: queryKeys.questions.detail(questionId || ""),
    queryFn: ({ signal }) => getQuestion(questionId!, signal),
    enabled: !!questionId,
  });
}

// Hook to fetch assessments that contain a question (for delete warning)
export function useQuestionAssessments(
  questionId: string | null,
  ownerId: string | null
) {
  return useQuery({
    queryKey: queryKeys.questions.assessments(questionId || ""),
    queryFn: ({ signal }) => getQuestionAssessments(questionId!, ownerId!, signal),
    enabled: !!questionId && !!ownerId,
  });
}

// Hook to update a question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: UpdateQuestionRequest;
    }) => updateQuestion(questionId, data),
    onSuccess: (updatedQuestion) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(updatedQuestion.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all(updatedQuestion.owner_id),
      });
      // Also invalidate any assessments that might contain this question
      queryClient.invalidateQueries({
        queryKey: ["assessments"],
      });
    },
  });
}

// Hook to delete a question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
    }: {
      questionId: string;
      ownerId: string;
    }) => deleteQuestion(questionId),
    onSuccess: (_, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.all(variables.ownerId),
      });
      // Invalidate all assessments (question might have been removed from them)
      queryClient.invalidateQueries({
        queryKey: ["assessments"],
      });
    },
  });
}
