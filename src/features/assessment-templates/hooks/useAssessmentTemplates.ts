// Assessment Template hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
import {
  getAssessmentTemplates,
  getAssessmentTemplate,
  createAssessmentTemplate,
  updateAssessmentTemplate,
  deleteAssessmentTemplate,
  addQuestionTemplateToAssessmentTemplate,
} from "../services/assessment-template.service";
import type {
  CreateAssessmentTemplateRequest,
  UpdateAssessmentTemplateRequest,
  AddQuestionTemplateRequest,
} from "../types/assessment-template.types";

// Hook to fetch all assessment templates for a user
export function useAssessmentTemplates(ownerId: string | null, folderId?: string) {
  return useQuery({
    queryKey: queryKeys.assessmentTemplates.all(ownerId || ""),
    queryFn: ({ signal }) => getAssessmentTemplates(ownerId!, folderId, signal),
    enabled: !!ownerId,
  });
}

// Hook to fetch a single assessment template
export function useAssessmentTemplate(templateId: string | null) {
  return useQuery({
    queryKey: queryKeys.assessmentTemplates.detail(templateId || ""),
    queryFn: ({ signal }) => getAssessmentTemplate(templateId!, signal),
    enabled: !!templateId,
  });
}

// Hook to create an assessment template
export function useCreateAssessmentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentTemplateRequest) =>
      createAssessmentTemplate(data),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.all(newTemplate.owner_id),
      });
      // Invalidate folder contents
      if (newTemplate.folder_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(newTemplate.folder_id),
        });
      }
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
      oldFolderId,
    }: {
      templateId: string;
      data: UpdateAssessmentTemplateRequest;
      oldFolderId?: string | null;
    }) => updateAssessmentTemplate(templateId, data),
    onSuccess: (updatedTemplate, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.detail(updatedTemplate.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.all(updatedTemplate.owner_id),
      });
      // Invalidate folder contents when template is moved or updated
      if (updatedTemplate.folder_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(updatedTemplate.folder_id),
        });
      }
      // Invalidate old folder contents when template is moved
      if (variables.oldFolderId && variables.oldFolderId !== updatedTemplate.folder_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.oldFolderId),
        });
      }
    },
  });
}

// Hook to delete an assessment template
export function useDeleteAssessmentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
    }: {
      templateId: string;
      ownerId: string;
      folderId?: string;
    }) => deleteAssessmentTemplate(templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.all(variables.ownerId),
      });
      if (variables.folderId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.folderId),
        });
      }
    },
  });
}

// Hook to add a question template to an assessment template
export function useAddQuestionTemplateToAssessmentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: AddQuestionTemplateRequest;
      ownerId: string;
    }) => addQuestionTemplateToAssessmentTemplate(templateId, data),
    onSuccess: (updatedTemplate, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.detail(updatedTemplate.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentTemplates.all(variables.ownerId),
      });
    },
  });
}
