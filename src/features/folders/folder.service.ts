// Folder service - API calls for folder management

import { api } from "@/api/client";
import type {
    CreateFolderRequest,
    FolderPathResponse,
    FolderResponse,
    FolderTreeResponse,
    FolderWithContentsResponse,
    ListFoldersFoldersGetParams,
    MoveFolderRequest,
    UpdateFolderRequest,
} from "@/api/models";

// Get the root folder for the authenticated user
export async function getUserRootFolder(): Promise<FolderResponse> {
    const response = await api.getUserRootFolderUsersMeRootFolderGet();
    return response.data;
}

// Create a new folder
export async function createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
    const response = await api.createFolderFoldersPost(data);
    return response.data;
}

// List folders for a user, optionally filtered by parent
export async function listFolders(params: ListFoldersFoldersGetParams): Promise<FolderResponse[]> {
    const response = await api.listFoldersFoldersGet(params);
    return response.data;
}

// Get a folder by ID
export async function getFolder(folderId: string): Promise<FolderResponse> {
    const response = await api.getFolderFoldersFolderIdGet(folderId);
    return response.data;
}

// Update folder (name, description)
export async function updateFolder(
    folderId: string,
    data: UpdateFolderRequest,
): Promise<FolderResponse> {
    const response = await api.updateFolderFoldersFolderIdPatch(folderId, data);
    return response.data;
}

// Delete a folder (cascade to children)
export async function deleteFolder(folderId: string): Promise<void> {
    const response = await api.softDeleteFolderFoldersFolderIdDelete(folderId);
    return response.data;
}

// Get folder with complete contents (assessments and templates)
export async function getFolderContents(folderId: string): Promise<FolderWithContentsResponse> {
    const response = await api.getFolderContentsFoldersFolderIdContentsGet(folderId);
    return response.data;
}

// Get folder with full subtree (all descendants in nested structure)
export async function getFolderTree(folderId: string): Promise<FolderTreeResponse> {
    const response = await api.getFolderTreeFoldersFolderIdTreeGet(folderId);
    return response.data;
}

// Get folder path from root to current folder
export async function getFolderPath(folderId: string): Promise<FolderPathResponse> {
    const response = await api.getFolderPathFoldersFolderIdPathGet(folderId);
    return response.data;
}

// Move folder to different parent
export async function moveFolder(
    folderId: string,
    data: MoveFolderRequest,
): Promise<FolderResponse> {
    const response = await api.moveFolderFoldersFolderIdMovePatch(folderId, data);
    return response.data;
}
