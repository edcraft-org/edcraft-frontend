// SaveTemplateModal - Modal for saving a question template to an assessment template

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAssessmentTemplates } from "@/features/assessment-templates/useAssessmentTemplates";
import { useFolders } from "@/features/folders/useFolders";
import { AssessmentTemplateBrowser } from "@/features/assessment-templates/components/AssessmentTemplateBrowser";
import { CreateAssessmentTemplateBankForm } from "./CreateAssessmentTemplateBankForm";

type SaveMode = "select" | "create";

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;
    onSaveToNew: (title: string, description: string | undefined, folderId: string) => void;
    onSaveToExisting: (assessmentTemplateId: string) => void;
    isLoading?: boolean;
}

export function SaveTemplateModal({
    open,
    onOpenChange,
    ownerId,
    currentFolderId,
    onSaveToNew,
    onSaveToExisting,
    isLoading,
}: SaveTemplateModalProps) {
    const [mode, setMode] = useState<SaveMode>("select");
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId);

    const { data: templates, isLoading: loadingTemplates } = useAssessmentTemplates(
        open ? ownerId : undefined
    );

    const { data: folders } = useFolders(
        open && mode === "create" ? {} : undefined
    );

    const handleClose = () => {
        onOpenChange(false);
        setMode("select");
        setNewTitle("");
        setNewDescription("");
        setSelectedFolderId(currentFolderId);
    };

    const handleSaveToNew = () => {
        if (!newTitle.trim() || !selectedFolderId) return;
        onSaveToNew(newTitle.trim(), newDescription.trim() || undefined, selectedFolderId);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "select" && "Save Question Template"}
                        {mode === "create" && "Create New Template Bank"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "select" && "Choose where to save this question template."}
                        {mode === "create" &&
                            "Create a new assessment template (template bank) to save this question template to."}
                    </DialogDescription>
                </DialogHeader>

                {mode === "select" && (
                    <div className="grid gap-3 py-4">
                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start"
                            onClick={() => setMode("create")}
                        >
                            <div className="flex items-start gap-4">
                                <Plus className="h-5 w-5 mt-0.5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium">Create New Template Bank</div>
                                    <div className="text-sm text-muted-foreground">
                                        Start a new assessment template to hold this and future
                                        templates
                                    </div>
                                </div>
                            </div>
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    or add to existing
                                </span>
                            </div>
                        </div>

                        {templates && (
                            <AssessmentTemplateBrowser
                                templates={templates}
                                isLoading={loadingTemplates}
                                onSelectTemplate={onSaveToExisting}
                                disabled={isLoading}
                            />
                        )}
                    </div>
                )}

                {mode === "create" && (
                    <CreateAssessmentTemplateBankForm
                        title={newTitle}
                        description={newDescription}
                        selectedFolderId={selectedFolderId}
                        folders={folders}
                        onTitleChange={setNewTitle}
                        onDescriptionChange={setNewDescription}
                        onFolderChange={setSelectedFolderId}
                        onSubmit={handleSaveToNew}
                        onCancel={() => setMode("select")}
                        isLoading={isLoading}
                        showBackButton
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
