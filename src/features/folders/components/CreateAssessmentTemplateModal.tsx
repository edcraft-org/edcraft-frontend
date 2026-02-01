// CreateAssessmentTemplateModal - Modal for creating a new assessment template

import { CreateResourceModal } from "./CreateResourceModal";
import type { CreateResourceModalConfig } from "./CreateResourceModal";

interface CreateAssessmentTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string, description?: string) => void;
    isLoading?: boolean;
}

const assessmentTemplateConfig: CreateResourceModalConfig = {
    title: "Create New Assessment Template",
    description:
        "Create a new assessment template (question template bank) to hold reusable question templates.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., Sorting Algorithm Templates",
    descriptionPlaceholder: "Add a description for this template bank...",
    submitButtonText: "Create Template",
};

export function CreateAssessmentTemplateModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: CreateAssessmentTemplateModalProps) {
    return (
        <CreateResourceModal
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            config={assessmentTemplateConfig}
        />
    );
}
