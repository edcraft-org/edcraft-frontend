// Folder hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    getUserRootFolder,
    createFolder,
    listFolders,
    getFolder,
    updateFolder,
    deleteFolder,
    getFolderContents,
    getFolderTree,
    getFolderPath,
    moveFolder,
} from "./folder.service";
import type {
    CreateFolderRequest,
    ListFoldersFoldersGetParams,
    UpdateFolderRequest,
    MoveFolderRequest,
} from "@/api/models";

// Hook to fetch the root folder for the authenticated user
export function useUserRootFolder() {
    return useQuery({
        queryKey: queryKeys.users.me,
        queryFn: () => getUserRootFolder(),
    });
}

// Hook to fetch folders list (optionally filtered by parent)
export function useFolders(
    params: ListFoldersFoldersGetParams | undefined,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: queryKeys.folders.byFolder(params?.parent_id || ""),
        queryFn: () => listFolders(params!),
        enabled: params !== undefined && (options?.enabled ?? true),
    });
}

// Hook to fetch a single folder
export function useFolder(folderId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.folders.detail(folderId || ""),
        queryFn: () => getFolder(folderId!),
        enabled: !!folderId,
    });
}

// Hook to fetch folder contents (assessments and templates)
export function useFolderContents(folderId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.folders.contents(folderId || ""),
        queryFn: () => getFolderContents(folderId!),
        enabled: !!folderId,
    });
}

// Hook to fetch folder tree (all descendants)
export function useFolderTree(folderId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.folders.tree(folderId || ""),
        queryFn: () => getFolderTree(folderId!),
        enabled: !!folderId,
    });
}

// Hook to fetch folder path (from root to current folder)
export function useFolderPath(folderId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.folders.path(folderId || ""),
        queryFn: () => getFolderPath(folderId!),
        enabled: !!folderId,
    });
}

// Hook to create a folder
export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateFolderRequest) => createFolder(data),
        onSuccess: (newFolder) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.all(newFolder.owner_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(newFolder.parent_id!),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.tree(newFolder.parent_id!),
            });
        },
    });
}

// Hook to update a folder
export function useUpdateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId, data }: { folderId: string; data: UpdateFolderRequest }) =>
            updateFolder(folderId, data),
        onSuccess: (updatedFolder) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.detail(updatedFolder.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.all(updatedFolder.owner_id),
            });
            if (updatedFolder.parent_id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.folders.contents(updatedFolder.parent_id),
                });
            }
        },
    });
}

// Hook to delete a folder
export function useDeleteFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId }: { folderId: string; ownerId: string; parentId?: string }) =>
            deleteFolder(folderId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.all(variables.ownerId),
            });
            if (variables.parentId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.folders.contents(variables.parentId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.folders.tree(variables.parentId),
                });
            }
        },
    });
}

// Hook to move a folder to a different parent
export function useMoveFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            folderId,
            data,
        }: {
            folderId: string;
            data: MoveFolderRequest;
            oldParentId: string;
        }) => moveFolder(folderId, data),
        onSuccess: (movedFolder, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.detail(movedFolder.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.all(movedFolder.owner_id),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(variables.oldParentId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.tree(variables.oldParentId),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.contents(movedFolder.parent_id!),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.tree(movedFolder.parent_id!),
            });
        },
    });
}
