// Question Template hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
import {
  getQuestionTemplates,
  getQuestionTemplate,
  createQuestionTemplate,
  updateQuestionTemplate,
  deleteQuestionTemplate,
  getQuestionTemplateAssessmentTemplates,
  generateTemplatePreview,
  generateFromTemplate,
  type GenerateTemplatePreviewRequest,
  type GenerateFromTemplateRequest,
} from "../services/template.service";
import type {
  QuestionTemplateCreate as CreateQuestionTemplateRequest,
  QuestionTemplateUpdate as UpdateQuestionTemplateRequest,
} from "@/generated";

// Hook to fetch all question templates for a user
export function useQuestionTemplates(ownerId: string | null) {
  return useQuery({
    queryKey: queryKeys.questionTemplates.all(ownerId || ""),
    queryFn: ({ signal }) => getQuestionTemplates(ownerId!, signal),
    enabled: !!ownerId,
  });
}

// Hook to fetch a single question template
export function useQuestionTemplate(templateId: string | null) {
  return useQuery({
    queryKey: queryKeys.questionTemplates.detail(templateId || ""),
    queryFn: ({ signal }) => getQuestionTemplate(templateId!, signal),
    enabled: !!templateId,
  });
}

// Hook to fetch assessment templates that contain a question template (for delete warning)
export function useQuestionTemplateAssessmentTemplates(
  templateId: string | null,
  ownerId: string | null
) {
  return useQuery({
    queryKey: queryKeys.questionTemplates.assessmentTemplates(templateId || ""),
    queryFn: ({ signal }) =>
      getQuestionTemplateAssessmentTemplates(templateId!, ownerId!, signal),
    enabled: !!templateId && !!ownerId,
  });
}

// Hook to create a question template
export function useCreateQuestionTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionTemplateRequest) =>
      createQuestionTemplate(data),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questionTemplates.all(newTemplate.owner_id),
      });
    },
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
      // Invalidate assessment templates that might contain this
      queryClient.invalidateQueries({
        queryKey: ["assessment-templates"],
      });
    },
  });
}

// Hook to delete a question template
export function useDeleteQuestionTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
    }: {
      templateId: string;
      ownerId: string;
    }) => deleteQuestionTemplate(templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questionTemplates.all(variables.ownerId),
      });
      // Invalidate all assessment templates
      queryClient.invalidateQueries({
        queryKey: ["assessment-templates"],
      });
    },
  });
}

// Hook to generate a template preview
export function useGenerateTemplatePreview() {
  return useMutation({
    mutationFn: (data: GenerateTemplatePreviewRequest) =>
      generateTemplatePreview(data),
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
      data: GenerateFromTemplateRequest;
    }) => generateFromTemplate(templateId, data),
  });
}
