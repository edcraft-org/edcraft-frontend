// Question template bank service - API calls for question template bank management

import { api } from "@/api/client";
import type {
    QuestionTemplateBankResponse,
    QuestionTemplateBankWithTemplatesResponse,
    CreateQuestionTemplateBankRequest,
    UpdateQuestionTemplateBankRequest,
    InsertQuestionTemplateIntoQuestionTemplateBankRequest,
    LinkQuestionTemplateToQuestionTemplateBankRequest,
} from "@/api/models";

// Get all question template banks for a user
export async function getQuestionTemplateBanks(
    folderId?: string,
): Promise<QuestionTemplateBankResponse[]> {
    const response = await api.listQuestionTemplateBanksQuestionTemplateBanksGet({
        folder_id: folderId,
    });
    return response.data;
}

// Get question template banks shared with the current user (non-owner role)
export async function getSharedQuestionTemplateBanks(): Promise<QuestionTemplateBankResponse[]> {
    const response = await api.listQuestionTemplateBanksQuestionTemplateBanksGet({
        collab_filter: "shared",
    });
    return response.data;
}

// Get a single question template bank with all templates
export async function getQuestionTemplateBank(
    templateBankId: string,
): Promise<QuestionTemplateBankWithTemplatesResponse> {
    const response =
        await api.getQuestionTemplateBankQuestionTemplateBanksQuestionTemplateBankIdGet(
            templateBankId,
        );
    return response.data;
}

// Create a new question template bank
export async function createQuestionTemplateBank(
    data: CreateQuestionTemplateBankRequest,
): Promise<QuestionTemplateBankResponse> {
    const response = await api.createQuestionTemplateBankQuestionTemplateBanksPost(data);
    return response.data;
}

// Update a question template bank
export async function updateQuestionTemplateBank(
    templateBankId: string,
    data: UpdateQuestionTemplateBankRequest,
): Promise<QuestionTemplateBankResponse> {
    const response =
        await api.updateQuestionTemplateBankQuestionTemplateBanksQuestionTemplateBankIdPatch(
            templateBankId,
            data,
        );
    return response.data;
}

// Delete a question template bank
export async function deleteQuestionTemplateBank(templateBankId: string): Promise<void> {
    const response =
        await api.softDeleteQuestionTemplateBankQuestionTemplateBanksQuestionTemplateBankIdDelete(
            templateBankId,
        );
    return response.data;
}

// Insert a new question template into a template bank
export async function insertQuestionTemplateIntoBank(
    templateBankId: string,
    data: InsertQuestionTemplateIntoQuestionTemplateBankRequest,
): Promise<QuestionTemplateBankWithTemplatesResponse> {
    const response =
        await api.insertQuestionTemplateIntoBankQuestionTemplateBanksQuestionTemplateBankIdQuestionTemplatesPost(
            templateBankId,
            data,
        );
    return response.data;
}

// Link an existing question template to a template bank
export async function linkQuestionTemplateToBank(
    templateBankId: string,
    data: LinkQuestionTemplateToQuestionTemplateBankRequest,
): Promise<QuestionTemplateBankWithTemplatesResponse> {
    const response =
        await api.linkQuestionTemplateToBankQuestionTemplateBanksQuestionTemplateBankIdQuestionTemplatesLinkPost(
            templateBankId,
            data,
        );
    return response.data;
}

// Sync a linked question template's content from its source
export async function syncQuestionTemplateInBank(
    templateBankId: string,
    questionTemplateId: string,
): Promise<QuestionTemplateBankWithTemplatesResponse> {
    const response =
        await api.syncQuestionTemplateInBankQuestionTemplateBanksQuestionTemplateBankIdQuestionTemplatesQuestionTemplateIdSyncPost(
            templateBankId,
            questionTemplateId,
        );
    return response.data;
}

// Sever the source link on a question template (making it fully independent)
export async function unlinkQuestionTemplateInBank(
    templateBankId: string,
    questionTemplateId: string,
): Promise<QuestionTemplateBankWithTemplatesResponse> {
    const response =
        await api.unlinkQuestionTemplateInBankQuestionTemplateBanksQuestionTemplateBankIdQuestionTemplatesQuestionTemplateIdUnlinkPost(
            templateBankId,
            questionTemplateId,
        );
    return response.data;
}

// Remove (unlink) a question template from a template bank
export async function removeQuestionTemplateFromBank(
    templateBankId: string,
    questionTemplateId: string,
): Promise<void> {
    const response =
        await api.removeQuestionTemplateFromBankQuestionTemplateBanksQuestionTemplateBankIdQuestionTemplatesQuestionTemplateIdDelete(
            templateBankId,
            questionTemplateId,
        );
    return response.data;
}
