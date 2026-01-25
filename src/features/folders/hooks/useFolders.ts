// Folder hooks using TanStack Query

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
import { ApiError } from "@/shared/services/api-client";
import {
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder,
} from "../services/folder.service";
import type {
  FolderCreate as CreateFolderRequest,
  FolderUpdate as UpdateFolderRequest,
  FolderMove as MoveFolderRequest,
} from "@/generated";

// Hook to create a folder
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFolderRequest) => createFolder(data),
    onSuccess: (newFolder) => {
      // Invalidate folder tree
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.all(newFolder.owner_id),
      });
      // Invalidate parent folder contents
      if (newFolder.parent_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(newFolder.parent_id),
        });
      }
    },
  });
}

// Hook to update a folder
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      data,
    }: {
      folderId: string;
      data: UpdateFolderRequest;
      ownerId: string;
      parentId: string | null;
    }) => updateFolder(folderId, data),
    onSuccess: (updatedFolder, variables) => {
      // Invalidate folder detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.detail(updatedFolder.id),
      });
      // Invalidate folder contents if it's a parent
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.contents(updatedFolder.id),
      });
      // Invalidate parent folder contents
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.parentId),
        });
      }
      // Invalidate folder tree
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.all(variables.ownerId),
      });
    },
  });
}

// Hook to delete a folder
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
    }: {
      folderId: string;
      ownerId: string;
      parentId: string | null;
    }) => deleteFolder(folderId),
    onSuccess: (_, variables) => {
      // Invalidate folder tree
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.all(variables.ownerId),
      });
      // Invalidate parent folder contents
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.parentId),
        });
      }
    },
    onError: (error: ApiError) => {
      if (error.status === 403) {
        // User-friendly message for root folder protection
        throw new Error("Cannot delete root folder. Root folders are protected.");
      }
      throw error;
    },
  });
}

// Hook to move a folder
export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      data,
    }: {
      folderId: string;
      data: MoveFolderRequest;
      ownerId: string;
      oldParentId: string | null;
    }) => moveFolder(folderId, data),
    onSuccess: (movedFolder, variables) => {
      // Invalidate folder tree
      queryClient.invalidateQueries({
        queryKey: queryKeys.folders.all(variables.ownerId),
      });
      // Invalidate old parent folder contents
      if (variables.oldParentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(variables.oldParentId),
        });
      }
      // Invalidate new parent folder contents
      if (movedFolder.parent_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.folders.contents(movedFolder.parent_id),
        });
      }
    },
  });
}
