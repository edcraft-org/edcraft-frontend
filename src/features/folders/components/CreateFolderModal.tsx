// CreateFolderModal - Modal for creating a new folder

import { CreateResourceModal } from "./CreateResourceModal";
import type { CreateResourceModalConfig } from "./CreateResourceModal";

interface CreateFolderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string, description?: string) => void;
    isLoading?: boolean;
}

const folderConfig: CreateResourceModalConfig = {
    title: "Create New Folder",
    description: "Create a new folder to organize your assessments and templates.",
    primaryFieldLabel: "Name *",
    primaryFieldPlaceholder: "e.g., CS101 Materials",
    descriptionPlaceholder: "Add a description for this folder...",
    submitButtonText: "Create Folder",
};

export function CreateFolderModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: CreateFolderModalProps) {
    return (
        <CreateResourceModal
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
            config={folderConfig}
        />
    );
}
