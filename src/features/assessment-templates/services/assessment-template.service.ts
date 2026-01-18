// Assessment Template service - API calls for assessment template management

import { apiClient } from "@/shared/services/api-client";
import type {
  AssessmentTemplate,
  AssessmentTemplateWithTemplates,
  CreateAssessmentTemplateRequest,
  UpdateAssessmentTemplateRequest,
  AddQuestionTemplateRequest,
} from "../types/assessment-template.types";

// Get all assessment templates for a user
export async function getAssessmentTemplates(
  ownerId: string,
  folderId?: string,
  signal?: AbortSignal
): Promise<AssessmentTemplate[]> {
  let url = `/assessment-templates?owner_id=${ownerId}`;
  if (folderId) {
    url += `&folder_id=${folderId}`;
  }
  return apiClient.get<AssessmentTemplate[]>(url, signal);
}

// Get a single assessment template
export async function getAssessmentTemplate(
  templateId: string,
  signal?: AbortSignal
): Promise<AssessmentTemplate> {
  return apiClient.get<AssessmentTemplate>(
    `/assessment-templates/${templateId}`,
    signal
  );
}

// Create a new assessment template
export async function createAssessmentTemplate(
  data: CreateAssessmentTemplateRequest,
  signal?: AbortSignal
): Promise<AssessmentTemplate> {
  return apiClient.post<AssessmentTemplate>("/assessment-templates", data, signal);
}

// Update an assessment template
export async function updateAssessmentTemplate(
  templateId: string,
  data: UpdateAssessmentTemplateRequest,
  signal?: AbortSignal
): Promise<AssessmentTemplate> {
  return apiClient.patch<AssessmentTemplate>(
    `/assessment-templates/${templateId}`,
    data,
    signal
  );
}

// Delete an assessment template
export async function deleteAssessmentTemplate(
  templateId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(`/assessment-templates/${templateId}`, signal);
}

// Add a question template to an assessment template
export async function addQuestionTemplateToAssessmentTemplate(
  templateId: string,
  data: AddQuestionTemplateRequest,
  signal?: AbortSignal
): Promise<AssessmentTemplateWithTemplates> {
  return apiClient.post<AssessmentTemplateWithTemplates>(
    `/assessment-templates/${templateId}/question-templates`,
    data,
    signal
  );
}
