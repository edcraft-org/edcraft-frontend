// CreateAssessmentModal - Modal for creating a new assessment

import { CreateResourceModal } from "./CreateResourceModal";
import type { CreateResourceModalConfig } from "./CreateResourceModal";

interface CreateAssessmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string, description?: string) => void;
    isLoading?: boolean;
}

const assessmentConfig: CreateResourceModalConfig = {
    title: "Create New Assessment",
    description: "Create a new assessment to hold your questions.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., Week 1 Quiz",
    descriptionPlaceholder: "Add a description for this assessment...",
    submitButtonText: "Create Assessment",
};

export function CreateAssessmentModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: CreateAssessmentModalProps) {
    return (
        <CreateResourceModal
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            config={assessmentConfig}
        />
    );
}
