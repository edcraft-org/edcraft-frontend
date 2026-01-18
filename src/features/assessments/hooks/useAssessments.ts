// Assessment hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
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
} from "../services/assessment.service";
import type {
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "../types/assessment.types";
import type {
  AddQuestionToAssessmentRequest,
  LinkQuestionRequest,
  ReorderQuestionsRequest,
} from "@/features/questions/types/question.types";

// Hook to fetch all assessments for a user
export function useAssessments(ownerId: string | null, folderId?: string) {
  return useQuery({
    queryKey: queryKeys.assessments.all(ownerId || ""),
    queryFn: ({ signal }) => getAssessments(ownerId!, folderId, signal),
    enabled: !!ownerId,
  });
}

// Hook to fetch a single assessment with questions
export function useAssessment(assessmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.assessments.detail(assessmentId || ""),
    queryFn: ({ signal }) => getAssessment(assessmentId!, signal),
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
      // Invalidate folder contents
      if (newAssessment.folder_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(newAssessment.folder_id),
        });
      }
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
    }) => updateAssessment(assessmentId, data),
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.detail(updatedAssessment.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.all(updatedAssessment.owner_id),
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
      folderId?: string;
    }) => deleteAssessment(assessmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.all(variables.ownerId),
      });
      if (variables.folderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.folderId),
        });
      }
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
      data: AddQuestionToAssessmentRequest;
    }) => addQuestionToAssessment(assessmentId, data),
    onSuccess: (updatedAssessment) => {
      queryClient.setQueryData(
        queryKeys.assessments.detail(updatedAssessment.id),
        updatedAssessment
      );
      // Invalidate questions list since a new question was created
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
      data: LinkQuestionRequest;
    }) => linkQuestionToAssessment(assessmentId, data),
    onSuccess: (updatedAssessment) => {
      queryClient.setQueryData(
        queryKeys.assessments.detail(updatedAssessment.id),
        updatedAssessment
      );
    },
  });
}

// Hook to remove a question from an assessment
export function useRemoveQuestionFromAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assessmentId,
      questionId,
    }: {
      assessmentId: string;
      questionId: string;
    }) => removeQuestionFromAssessment(assessmentId, questionId),
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
      data: ReorderQuestionsRequest;
    }) => reorderQuestions(assessmentId, data),
    onSuccess: (updatedAssessment) => {
      queryClient.setQueryData(
        queryKeys.assessments.detail(updatedAssessment.id),
        updatedAssessment
      );
    },
  });
}
