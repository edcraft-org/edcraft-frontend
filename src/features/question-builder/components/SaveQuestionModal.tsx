// SaveQuestionModal - Modal for saving questions to assessments or question banks

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Database } from "lucide-react";
import { useAssessments } from "@/features/assessments/useAssessments";
import { useQuestionBanks } from "@/features/question-banks/useQuestionBanks";
import { useFolders } from "@/features/folders/useFolders";
import { AssessmentBrowser } from "@/features/assessments/components/AssessmentBrowser";
import { CreateAssessmentForm } from "@/features/assessments/components/CreateAssessmentForm";
import { QuestionBankBrowser, CreateQuestionBankForm } from "@/features/question-banks/components";

type ModalView = "destination" | "assessment" | "question-bank";
type SubMode = "select" | "create";

interface SaveQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;

    // Assessment callbacks
    onSaveToNewAssessment: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingAssessment: (assessmentId: string) => void;

    // Question bank callbacks
    onSaveToNewQuestionBank: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingQuestionBank: (questionBankId: string) => void;

    // Loading states
    isLoadingAssessment?: boolean;
    isLoadingQuestionBank?: boolean;

    // Pre-selection
    preSelectedAssessmentId?: string;
    preSelectedQuestionBankId?: string;

    // Optional: Skip destination choice
    initialView?: ModalView;
}

export function SaveQuestionModal({
    open,
    onOpenChange,
    ownerId,
    currentFolderId,
    onSaveToNewAssessment,
    onSaveToExistingAssessment,
    onSaveToNewQuestionBank,
    onSaveToExistingQuestionBank,
    isLoadingAssessment,
    isLoadingQuestionBank,
    preSelectedAssessmentId,
    preSelectedQuestionBankId,
    initialView = "destination",
}: SaveQuestionModalProps) {
    // View navigation
    const [currentView, setCurrentView] = useState<ModalView>(initialView);
    const [assessmentMode, setAssessmentMode] = useState<SubMode>("select");
    const [questionBankMode, setQuestionBankMode] = useState<SubMode>("select");

    // Assessment creation state
    const [assessmentTitle, setAssessmentTitle] = useState("");
    const [assessmentDescription, setAssessmentDescription] = useState("");
    const [assessmentFolderId, setAssessmentFolderId] = useState<string>(currentFolderId);

    // Question bank creation state
    const [questionBankTitle, setQuestionBankTitle] = useState("");
    const [questionBankDescription, setQuestionBankDescription] = useState("");
    const [questionBankFolderId, setQuestionBankFolderId] = useState<string>(currentFolderId);

    // Data fetching
    const { data: assessments, isLoading: loadingAssessments } = useAssessments(
        open && currentView === "assessment" ? ownerId : undefined,
    );

    const { data: questionBanks, isLoading: loadingQuestionBanks } = useQuestionBanks(
        open && currentView === "question-bank" ? ownerId : undefined,
    );

    const { data: folders } = useFolders(
        open && (assessmentMode === "create" || questionBankMode === "create") ? {} : undefined,
    );

    // Reset to initialView when modal opens
    useEffect(() => {
        if (open) {
            setCurrentView(initialView);
        }
    }, [open, initialView]);

    const handleClose = () => {
        onOpenChange(false);
        setCurrentView(initialView);
        setAssessmentMode("select");
        setQuestionBankMode("select");
        setAssessmentTitle("");
        setAssessmentDescription("");
        setAssessmentFolderId(currentFolderId);
        setQuestionBankTitle("");
        setQuestionBankDescription("");
        setQuestionBankFolderId(currentFolderId);
    };

    const handleSaveToNewAssessment = () => {
        if (!assessmentTitle.trim() || !assessmentFolderId) return;
        onSaveToNewAssessment(
            assessmentTitle.trim(),
            assessmentDescription.trim() || undefined,
            assessmentFolderId,
        );
    };

    const handleSaveToNewQuestionBank = () => {
        if (!questionBankTitle.trim() || !questionBankFolderId) return;
        onSaveToNewQuestionBank(
            questionBankTitle.trim(),
            questionBankDescription.trim() || undefined,
            questionBankFolderId,
        );
    };

    // Dynamic modal content
    const getModalContent = () => {
        if (currentView === "destination") {
            return {
                title: "Save Question",
                description: "Choose where to save this question",
            };
        }

        if (currentView === "assessment") {
            return assessmentMode === "select"
                ? {
                      title: "Save Question",
                      description: "Choose where to save this question.",
                  }
                : {
                      title: "Create New Assessment",
                      description: "Create a new assessment to save this question to.",
                  };
        }

        // currentView === "question-bank"
        return questionBankMode === "select"
            ? {
                  title: "Save Question",
                  description: "Choose where to save this question.",
              }
            : {
                  title: "Create New Question Bank",
                  description: "Create a new question bank to save this question to.",
              };
    };

    const modalContent = getModalContent();

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{modalContent.title}</DialogTitle>
                    <DialogDescription>{modalContent.description}</DialogDescription>
                </DialogHeader>

                {/* Destination View */}
                {currentView === "destination" && (
                    <div className="grid gap-3 py-4">
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCurrentView("assessment")}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <FileText className="h-6 w-6 text-primary mt-0.5" />
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-base">
                                            Save to Assessment
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Add to a quiz, test, or exam
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCurrentView("question-bank")}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Database className="h-6 w-6 text-primary mt-0.5" />
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-base">
                                            Save to Question Bank
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Add to a reusable question library
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Assessment View */}
                {currentView === "assessment" && (
                    <>
                        {assessmentMode === "select" && (
                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentView("destination")}
                                >
                                    ← Back
                                </Button>

                                <div className="grid gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 px-4 justify-start"
                                        onClick={() => setAssessmentMode("create")}
                                    >
                                        <div className="flex items-start gap-4">
                                            <Plus className="h-5 w-5 mt-0.5 text-primary" />
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    Create New Assessment
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Start a new assessment to hold this and future
                                                    questions
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
                                            onSelectAssessment={onSaveToExistingAssessment}
                                            disabled={isLoadingAssessment}
                                            preSelectedAssessmentId={preSelectedAssessmentId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {assessmentMode === "create" && (
                            <CreateAssessmentForm
                                title={assessmentTitle}
                                description={assessmentDescription}
                                selectedFolderId={assessmentFolderId}
                                folders={folders}
                                onTitleChange={setAssessmentTitle}
                                onDescriptionChange={setAssessmentDescription}
                                onFolderChange={setAssessmentFolderId}
                                onSubmit={handleSaveToNewAssessment}
                                onCancel={() => setAssessmentMode("select")}
                                isLoading={isLoadingAssessment}
                                showBackButton
                            />
                        )}
                    </>
                )}

                {/* Question Bank View */}
                {currentView === "question-bank" && (
                    <>
                        {questionBankMode === "select" && (
                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentView("destination")}
                                >
                                    ← Back
                                </Button>

                                <div className="grid gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 px-4 justify-start"
                                        onClick={() => setQuestionBankMode("create")}
                                    >
                                        <div className="flex items-start gap-4">
                                            <Plus className="h-5 w-5 mt-0.5 text-primary" />
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    Create New Question Bank
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Start a new question bank to hold this and
                                                    future questions
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
                                                or add to existing question bank
                                            </span>
                                        </div>
                                    </div>

                                    {questionBanks && (
                                        <QuestionBankBrowser
                                            questionBanks={questionBanks}
                                            isLoading={loadingQuestionBanks}
                                            onSelectQuestionBank={onSaveToExistingQuestionBank}
                                            disabled={isLoadingQuestionBank}
                                            preSelectedQuestionBankId={preSelectedQuestionBankId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {questionBankMode === "create" && (
                            <CreateQuestionBankForm
                                title={questionBankTitle}
                                description={questionBankDescription}
                                selectedFolderId={questionBankFolderId}
                                folders={folders}
                                onTitleChange={setQuestionBankTitle}
                                onDescriptionChange={setQuestionBankDescription}
                                onFolderChange={setQuestionBankFolderId}
                                onSubmit={handleSaveToNewQuestionBank}
                                onCancel={() => setQuestionBankMode("select")}
                                isLoading={isLoadingQuestionBank}
                                showBackButton
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
