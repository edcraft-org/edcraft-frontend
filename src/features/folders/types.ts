// Types for folder resources

import type {
    FolderResponse,
    AssessmentResponse,
    AssessmentTemplateResponse,
    QuestionBankResponse,
    QuestionTemplateBankResponse,
} from "@/api/models";

// Resource type discriminated union
export type ResourceType =
    | "folder"
    | "assessment"
    | "assessment_template"
    | "question_bank"
    | "question_template_bank";

export type FolderResource = FolderResponse & { resourceType: "folder" };
export type AssessmentResource = AssessmentResponse & { resourceType: "assessment" };
export type AssessmentTemplateResource = AssessmentTemplateResponse & {
    resourceType: "assessment_template";
};
export type QuestionBankResource = QuestionBankResponse & { resourceType: "question_bank" };
export type QuestionTemplateBankResource = QuestionTemplateBankResponse & {
    resourceType: "question_template_bank";
};

export type Resource =
    | FolderResource
    | AssessmentResource
    | AssessmentTemplateResource
    | QuestionBankResource
    | QuestionTemplateBankResource;

// Helper to get display name from a resource
export function getResourceDisplayName(resource: Resource): string {
    return resource.resourceType === "folder" ? resource.name : resource.title;
}
