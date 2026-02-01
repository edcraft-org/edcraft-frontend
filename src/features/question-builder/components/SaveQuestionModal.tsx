// SaveQuestionModal - Modal for saving a generated question to an assessment

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
import { useAssessments } from "@/features/assessments/useAssessments";
import { useFolders } from "@/features/folders/useFolders";
import { AssessmentBrowser } from "@/features/assessments/components/AssessmentBrowser";
import { CreateAssessmentForm } from "@/features/assessments/components/CreateAssessmentForm";

type SaveMode = "select" | "create";

interface SaveQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;
    onSaveToNew: (title: string, description: string | undefined, folderId: string) => void;
    onSaveToExisting: (assessmentId: string) => void;
    isLoading?: boolean;
    preSelectedAssessmentId?: string;
}

export function SaveQuestionModal({
    open,
    onOpenChange,
    ownerId,
    currentFolderId,
    onSaveToNew,
    onSaveToExisting,
    isLoading,
    preSelectedAssessmentId,
}: SaveQuestionModalProps) {
    const [mode, setMode] = useState<SaveMode>("select");
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId);

    const { data: assessments, isLoading: loadingAssessments } = useAssessments(
        open ? ownerId : undefined,
    );

    const { data: folders } = useFolders(
        open && mode === "create" ? { owner_id: ownerId } : undefined,
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
                        {mode === "select" && "Save Question"}
                        {mode === "create" && "Create New Assessment"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "select" && "Choose where to save this question."}
                        {mode === "create" && "Create a new assessment to save this question to."}
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
                                    <div className="font-medium">Create New Assessment</div>
                                    <div className="text-sm text-muted-foreground">
                                        Start a new assessment to hold this and future questions
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

                        {assessments && (
                            <AssessmentBrowser
                                assessments={assessments}
                                isLoading={loadingAssessments}
                                onSelectAssessment={onSaveToExisting}
                                disabled={isLoading}
                                preSelectedAssessmentId={preSelectedAssessmentId}
                            />
                        )}
                    </div>
                )}

                {mode === "create" && (
                    <CreateAssessmentForm
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
