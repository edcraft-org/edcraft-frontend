// Folder-related types

import type { BaseEntity } from "@/shared/types/common.types";

export interface Folder extends BaseEntity {
  owner_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
}

// Resource types that can exist in a folder
export type ResourceType = "folder" | "assessment" | "assessment_template";

export interface FolderResource {
  id: string;
  type: ResourceType;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderContents {
  folder: Folder;
  folders: Folder[];
  assessments: FolderResource[];
  assessment_templates: FolderResource[];
}

export interface FolderPath {
  id: string;
  name: string;
}

export interface FolderTree {
  id: string;
  name: string;
  children: FolderTree[];
}

// Request types
export interface CreateFolderRequest {
  owner_id: string;
  parent_id: string | null;
  name: string;
  description?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
}

export interface MoveFolderRequest {
  parent_id: string | null;
}
