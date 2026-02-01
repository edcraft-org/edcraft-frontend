// Types for folder resources

import type { FolderResponse, AssessmentResponse, AssessmentTemplateResponse } from "@/api/models";

// Resource type discriminated union
export type ResourceType = "folder" | "assessment" | "assessment_template";

export type FolderResource = FolderResponse & { resourceType: "folder" };
export type AssessmentResource = AssessmentResponse & { resourceType: "assessment" };
export type AssessmentTemplateResource = AssessmentTemplateResponse & { resourceType: "assessment_template" };

export type Resource = FolderResource | AssessmentResource | AssessmentTemplateResource;

// Helper to get display name from a resource
export function getResourceDisplayName(resource: Resource): string {
  return resource.resourceType === "folder" ? resource.name : resource.title;
}
