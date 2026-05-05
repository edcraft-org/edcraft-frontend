import type { CreateResourceModalConfig } from "./CreateResourceModal";

export const createFolderConfig: CreateResourceModalConfig = {
    title: "Create New Folder",
    description: "Create a new folder to organize your assessments and templates.",
    primaryFieldLabel: "Name *",
    primaryFieldPlaceholder: "e.g., CS101 Materials",
    descriptionPlaceholder: "Add a description for this folder...",
    submitButtonText: "Create Folder",
};

export const createAssessmentConfig: CreateResourceModalConfig = {
    title: "Create New Assessment",
    description: "Create a new assessment.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., Week 1 Quiz",
    descriptionPlaceholder: "Add a description for this assessment...",
    submitButtonText: "Create Assessment",
};

export const createAssessmentTemplateConfig: CreateResourceModalConfig = {
    title: "Create New Assessment Template",
    description:
        "Create a new assessment template.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., Week 1 Quiz Template",
    descriptionPlaceholder: "Add a description for this assessment template...",
    submitButtonText: "Create Template",
};

export const createQuestionBankConfig: CreateResourceModalConfig = {
    title: "Create New Question Bank",
    description: "Create a question bank to organize and reuse questions.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., BFS Questions",
    descriptionPlaceholder: "Add a description for this question bank...",
    submitButtonText: "Create Question Bank",
};

export const createQuestionTemplateBankConfig: CreateResourceModalConfig = {
    title: "Create New Question Template Bank",
    description: "Create a template bank to organize and reuse question templates.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., BFS Question Templates",
    descriptionPlaceholder: "Add a description for this template bank...",
    submitButtonText: "Create Template Bank",
};
