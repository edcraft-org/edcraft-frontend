// Assessment Template service - API calls for assessment template management

import { api } from "@/api/client";
import type {
    AssessmentTemplateResponse,
    AssessmentTemplateWithQuestionTemplatesResponse,
    CreateAssessmentTemplateRequest,
    InsertQuestionTemplateIntoAssessmentTemplateRequest,
    LinkQuestionTemplateToAssessmentTemplateRequest,
    ReorderQuestionTemplatesInAssessmentTemplateRequest,
    UpdateAssessmentTemplateRequest,
} from "@/api/models";

// Get all assessment templates for a user
export async function getAssessmentTemplates(
    ownerId: string,
    folderId?: string,
): Promise<AssessmentTemplateResponse[]> {
    const response = await api.listAssessmentTemplatesAssessmentTemplatesGet({
        owner_id: ownerId,
        folder_id: folderId,
    });
    return response.data;
}

// Get a single assessment template with all question templates
export async function getAssessmentTemplate(
    templateId: string,
): Promise<AssessmentTemplateWithQuestionTemplatesResponse> {
    const response = await api.getAssessmentTemplateAssessmentTemplatesTemplateIdGet(templateId);
    return response.data;
}

// Create a new assessment template
export async function createAssessmentTemplate(
    data: CreateAssessmentTemplateRequest,
): Promise<AssessmentTemplateResponse> {
    const response = await api.createAssessmentTemplateAssessmentTemplatesPost(data);
    return response.data;
}

// Update an assessment template
export async function updateAssessmentTemplate(
    templateId: string,
    data: UpdateAssessmentTemplateRequest,
): Promise<AssessmentTemplateResponse> {
    const response = await api.updateAssessmentTemplateAssessmentTemplatesTemplateIdPatch(
        templateId,
        data,
    );
    return response.data;
}

// Delete an assessment template
export async function deleteAssessmentTemplate(templateId: string): Promise<void> {
    const response =
        await api.softDeleteAssessmentTemplateAssessmentTemplatesTemplateIdDelete(templateId);
    return response.data;
}

// Add a new question template to an assessment template
export async function addQuestionTemplateToAssessmentTemplate(
    templateId: string,
    data: InsertQuestionTemplateIntoAssessmentTemplateRequest,
): Promise<AssessmentTemplateWithQuestionTemplatesResponse> {
    const response =
        await api.insertQuestionTemplateToAssessmentTemplateAssessmentTemplatesTemplateIdQuestionTemplatesPost(
            templateId,
            data,
        );
    return response.data;
}

// Link an existing question template to an assessment template
export async function linkQuestionTemplateToAssessmentTemplate(
    templateId: string,
    data: LinkQuestionTemplateToAssessmentTemplateRequest,
): Promise<AssessmentTemplateWithQuestionTemplatesResponse> {
    const response =
        await api.linkQuestionTemplateToAssessmentTemplateAssessmentTemplatesTemplateIdQuestionTemplatesLinkPost(
            templateId,
            data,
        );
    return response.data;
}

// Remove (unlink) a question template from an assessment template
export async function removeQuestionTemplateFromAssessmentTemplate(
    templateId: string,
    questionTemplateId: string,
): Promise<void> {
    const response =
        await api.removeQuestionTemplateFromAssessmentTemplateAssessmentTemplatesTemplateIdQuestionTemplatesQuestionTemplateIdDelete(
            templateId,
            questionTemplateId,
        );
    return response.data;
}

// Reorder question templates in an assessment template
export async function reorderQuestionTemplatesInAssessmentTemplate(
    templateId: string,
    data: ReorderQuestionTemplatesInAssessmentTemplateRequest,
): Promise<AssessmentTemplateWithQuestionTemplatesResponse> {
    const response =
        await api.reorderQuestionTemplatesAssessmentTemplatesTemplateIdQuestionTemplatesReorderPatch(
            templateId,
            data,
        );
    return response.data;
}
