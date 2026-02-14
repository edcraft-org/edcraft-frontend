// CreateQuestionBankModal - Modal for creating a new question bank

import { CreateResourceModal } from "./CreateResourceModal";
import type { CreateResourceModalConfig } from "./CreateResourceModal";

interface CreateQuestionBankModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string, description?: string) => void;
    isLoading?: boolean;
}

const questionBankConfig: CreateResourceModalConfig = {
    title: "Create New Question Bank",
    description: "Create a question bank to organize and reuse questions.",
    primaryFieldLabel: "Title *",
    primaryFieldPlaceholder: "e.g., BFS Questions",
    descriptionPlaceholder: "Add a description for this question bank...",
    submitButtonText: "Create Question Bank",
};

export function CreateQuestionBankModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: CreateQuestionBankModalProps) {
    return (
        <CreateResourceModal
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            config={questionBankConfig}
        />
    );
}
