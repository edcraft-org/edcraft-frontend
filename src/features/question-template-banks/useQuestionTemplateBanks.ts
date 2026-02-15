// Question template bank hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getQuestionTemplateBanks,
    getQuestionTemplateBank,
    createQuestionTemplateBank,
    updateQuestionTemplateBank,
    deleteQuestionTemplateBank,
    insertQuestionTemplateIntoBank,
    linkQuestionTemplateToBank,
    removeQuestionTemplateFromBank,
} from "./question-template-bank.service";
import type {
    CreateQuestionTemplateBankRequest,
    UpdateQuestionTemplateBankRequest,
    InsertQuestionTemplateIntoQuestionTemplateBankRequest,
    LinkQuestionTemplateToQuestionTemplateBankRequest,
} from "@/api/models";

// Hook to fetch all question template banks for a user
export function useQuestionTemplateBanks(ownerId: string | undefined, folderId?: string) {
    return useQuery({
        queryKey: queryKeys.questionTemplateBanks.byFolder(ownerId || "", folderId || ""),
        queryFn: () => getQuestionTemplateBanks(folderId),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single question template bank with templates
export function useQuestionTemplateBank(templateBankId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questionTemplateBanks.detail(templateBankId || ""),
        queryFn: () => getQuestionTemplateBank(templateBankId!),
        enabled: !!templateBankId,
    });
}

// Hook to create a question template bank
export function useCreateQuestionTemplateBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateQuestionTemplateBankRequest) => createQuestionTemplateBank(data),
        onSuccess: (newTemplateBank) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(newTemplateBank.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newTemplateBank.folder_id),
            });
        },
    });
}

// Hook to update a question template bank
export function useUpdateQuestionTemplateBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateBankId,
            data,
        }: {
            templateBankId: string;
            data: UpdateQuestionTemplateBankRequest;
            oldFolderId: string;
        }) => updateQuestionTemplateBank(templateBankId, data),
        onSuccess: (updatedTemplateBank, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.detail(updatedTemplateBank.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(updatedTemplateBank.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(updatedTemplateBank.folder_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.oldFolderId),
            });
        },
    });
}

// Hook to delete a question template bank
export function useDeleteQuestionTemplateBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateBankId,
        }: {
            templateBankId: string;
            ownerId: string;
            folderId: string;
        }) => deleteQuestionTemplateBank(templateBankId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.folderId),
            });
        },
    });
}

// Hook to insert a new question template into a template bank
export function useInsertQuestionTemplateIntoBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateBankId,
            data,
        }: {
            templateBankId: string;
            data: InsertQuestionTemplateIntoQuestionTemplateBankRequest;
        }) => insertQuestionTemplateIntoBank(templateBankId, data),
        onSuccess: (updatedTemplateBank) => {
            queryClient.setQueryData(
                queryKeys.questionTemplateBanks.detail(updatedTemplateBank.id),
                updatedTemplateBank,
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplates.all(updatedTemplateBank.owner_id),
            });
        },
    });
}

// Hook to link an existing question template to a template bank
export function useLinkQuestionTemplateToBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateBankId,
            data,
        }: {
            templateBankId: string;
            data: LinkQuestionTemplateToQuestionTemplateBankRequest;
        }) => linkQuestionTemplateToBank(templateBankId, data),
        onSuccess: (updatedTemplateBank) => {
            queryClient.setQueryData(
                queryKeys.questionTemplateBanks.detail(updatedTemplateBank.id),
                updatedTemplateBank,
            );
        },
    });
}

// Hook to remove a question template from a template bank
export function useRemoveQuestionTemplateFromBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            templateBankId,
            questionTemplateId,
        }: {
            templateBankId: string;
            questionTemplateId: string;
        }) => removeQuestionTemplateFromBank(templateBankId, questionTemplateId),
        onSuccess: (_, { templateBankId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionTemplateBanks.detail(templateBankId),
            });
        },
    });
}
