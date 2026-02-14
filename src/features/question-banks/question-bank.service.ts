// Question bank service - API calls for question bank management

import { api } from "@/api/client";
import type {
    QuestionBankResponse,
    QuestionBankWithQuestionsResponse,
    CreateQuestionBankRequest,
    InsertQuestionIntoQuestionBankRequest,
    LinkQuestionToQuestionBankRequest,
    UpdateQuestionBankRequest,
} from "@/api/models";

// Get all question banks for a user
export async function getQuestionBanks(folderId?: string): Promise<QuestionBankResponse[]> {
    const response = await api.listQuestionBanksQuestionBanksGet({
        folder_id: folderId,
    });
    return response.data;
}

// Get a single question bank with all questions
export async function getQuestionBank(
    questionBankId: string,
): Promise<QuestionBankWithQuestionsResponse> {
    const response = await api.getQuestionBankQuestionBanksQuestionBankIdGet(questionBankId);
    return response.data;
}

// Create a new question bank
export async function createQuestionBank(
    data: CreateQuestionBankRequest,
): Promise<QuestionBankResponse> {
    const response = await api.createQuestionBankQuestionBanksPost(data);
    return response.data;
}

// Update a question bank
export async function updateQuestionBank(
    questionBankId: string,
    data: UpdateQuestionBankRequest,
): Promise<QuestionBankResponse> {
    const response = await api.updateQuestionBankQuestionBanksQuestionBankIdPatch(
        questionBankId,
        data,
    );
    return response.data;
}

// Delete a question bank
export async function deleteQuestionBank(questionBankId: string): Promise<void> {
    const response =
        await api.softDeleteQuestionBankQuestionBanksQuestionBankIdDelete(questionBankId);
    return response.data;
}

// Add a new question to a question bank
export async function addQuestionToQuestionBank(
    questionBankId: string,
    data: InsertQuestionIntoQuestionBankRequest,
): Promise<QuestionBankWithQuestionsResponse> {
    const response =
        await api.insertQuestionIntoQuestionBankQuestionBanksQuestionBankIdQuestionsPost(
            questionBankId,
            data,
        );
    return response.data;
}

// Link an existing question to a question bank
export async function linkQuestionToQuestionBank(
    questionBankId: string,
    data: LinkQuestionToQuestionBankRequest,
): Promise<QuestionBankWithQuestionsResponse> {
    const response =
        await api.linkQuestionIntoQuestionBankQuestionBanksQuestionBankIdQuestionsLinkPost(
            questionBankId,
            data,
        );
    return response.data;
}

// Remove (unlink) a question from a question bank
export async function removeQuestionFromQuestionBank(
    questionBankId: string,
    questionId: string,
): Promise<void> {
    const response =
        await api.removeQuestionFromQuestionBankQuestionBanksQuestionBankIdQuestionsQuestionIdDelete(
            questionBankId,
            questionId,
        );
    return response.data;
}
