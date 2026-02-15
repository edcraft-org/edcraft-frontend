// CreateQuestionTemplateBankModal - Modal for creating a new question template bank

import { CreateResourceModal } from "./CreateResourceModal";
import type { CreateResourceModalConfig } from "./CreateResourceModal";

interface CreateQuestionTemplateBankModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string, description?: string) => void;
    isLoading?: boolean;
}

const questionTemplateBankConfig: CreateResourceModalConfig = {
    title: "Create New Question Template Bank",
    description: "Create a template bank to organize and reuse question templates.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., BFS Algorithm Templates",
    descriptionPlaceholder: "Add a description for this template bank...",
    submitButtonText: "Create Template Bank",
};

export function CreateQuestionTemplateBankModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: CreateQuestionTemplateBankModalProps) {
    return (
        <CreateResourceModal
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            config={questionTemplateBankConfig}
        />
    );
}
