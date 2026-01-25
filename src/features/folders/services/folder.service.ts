// Folder service - API calls for folder management

import { apiClient } from "@/shared/services/api-client";
import type {
  FolderResponse as Folder,
  FolderCreate as CreateFolderRequest,
  FolderUpdate as UpdateFolderRequest,
  FolderMove as MoveFolderRequest,
} from "@/generated";

// Create a new folder
export async function createFolder(
  data: CreateFolderRequest,
  signal?: AbortSignal
): Promise<Folder> {
  return apiClient.post<Folder>("/folders", data, signal);
}

// Update a folder
export async function updateFolder(
  folderId: string,
  data: UpdateFolderRequest,
  signal?: AbortSignal
): Promise<Folder> {
  return apiClient.patch<Folder>(`/folders/${folderId}`, data, signal);
}

// Delete a folder
export async function deleteFolder(
  folderId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(`/folders/${folderId}`, signal);
}

// Move a folder to a different parent
export async function moveFolder(
  folderId: string,
  data: MoveFolderRequest,
  signal?: AbortSignal
): Promise<Folder> {
  return apiClient.patch<Folder>(`/folders/${folderId}/move`, data, signal);
}

// Get user's root folder
export async function getUserRootFolder(
  userId: string,
  signal?: AbortSignal
): Promise<Folder> {
  return apiClient.get<Folder>(`/users/${userId}/root-folder`, signal);
}
