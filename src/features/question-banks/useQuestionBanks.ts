// Question bank hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getQuestionBanks,
    getQuestionBank,
    createQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    addQuestionToQuestionBank,
    linkQuestionToQuestionBank,
    removeQuestionFromQuestionBank,
} from "./question-bank.service";
import type {
    CreateQuestionBankRequest,
    InsertQuestionIntoQuestionBankRequest,
    LinkQuestionToQuestionBankRequest,
    UpdateQuestionBankRequest,
} from "@/api/models";

// Hook to fetch all question banks for a user
export function useQuestionBanks(ownerId: string | undefined, folderId?: string) {
    return useQuery({
        queryKey: queryKeys.questionBanks.byFolder(ownerId || "", folderId || ""),
        queryFn: () => getQuestionBanks(folderId),
        enabled: !!ownerId,
    });
}

// Hook to fetch a single question bank with questions
export function useQuestionBank(questionBankId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questionBanks.detail(questionBankId || ""),
        queryFn: () => getQuestionBank(questionBankId!),
        enabled: !!questionBankId,
    });
}

// Hook to create a question bank
export function useCreateQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateQuestionBankRequest) => createQuestionBank(data),
        onSuccess: (newQuestionBank) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.all(newQuestionBank.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newQuestionBank.folder_id),
            });
        },
    });
}

// Hook to update a question bank
export function useUpdateQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            questionBankId,
            data,
        }: {
            questionBankId: string;
            data: UpdateQuestionBankRequest;
            oldFolderId: string;
        }) => updateQuestionBank(questionBankId, data),
        onSuccess: (updatedQuestionBank, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.detail(updatedQuestionBank.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.all(updatedQuestionBank.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(updatedQuestionBank.folder_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.oldFolderId),
            });
        },
    });
}

// Hook to delete a question bank
export function useDeleteQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            questionBankId,
        }: {
            questionBankId: string;
            ownerId: string;
            folderId: string;
        }) => deleteQuestionBank(questionBankId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.all(variables.ownerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.folderId),
            });
        },
    });
}

// Hook to add a new question to a question bank
export function useAddQuestionToQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            questionBankId,
            data,
        }: {
            questionBankId: string;
            data: InsertQuestionIntoQuestionBankRequest;
        }) => addQuestionToQuestionBank(questionBankId, data),
        onSuccess: (updatedQuestionBank) => {
            queryClient.setQueryData(
                queryKeys.questionBanks.detail(updatedQuestionBank.id),
                updatedQuestionBank,
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.questions.all(updatedQuestionBank.owner_id),
            });
        },
    });
}

// Hook to link an existing question to a question bank
export function useLinkQuestionToQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            questionBankId,
            data,
        }: {
            questionBankId: string;
            data: LinkQuestionToQuestionBankRequest;
        }) => linkQuestionToQuestionBank(questionBankId, data),
        onSuccess: (updatedQuestionBank) => {
            queryClient.setQueryData(
                queryKeys.questionBanks.detail(updatedQuestionBank.id),
                updatedQuestionBank,
            );
        },
    });
}

// Hook to remove a question from a question bank
export function useRemoveQuestionFromQuestionBank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            questionBankId,
            questionId,
        }: {
            questionBankId: string;
            questionId: string;
        }) => removeQuestionFromQuestionBank(questionBankId, questionId),
        onSuccess: (_, { questionBankId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.questionBanks.detail(questionBankId),
            });
        },
    });
}
