// SaveTemplateModal - Modal for saving question templates to assessment templates or question template banks

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
import { useAssessmentTemplates } from "@/features/assessment-templates/useAssessmentTemplates";
import { useQuestionTemplateBanks } from "@/features/question-template-banks/useQuestionTemplateBanks";
import { useFolders } from "@/features/folders/useFolders";
import { AssessmentTemplateBrowser } from "@/features/assessment-templates/components/AssessmentTemplateBrowser";
import { CreateAssessmentTemplateBankForm } from "./CreateAssessmentTemplateBankForm";
import { QuestionTemplateBankBrowser, CreateQuestionTemplateBankForm } from "@/features/question-template-banks/components";

type ModalView = "destination" | "assessment-template" | "question-template-bank";
type SubMode = "select" | "create";

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;

    // Assessment template callbacks
    onSaveToNewAssessmentTemplate: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingAssessmentTemplate: (assessmentTemplateId: string) => void;

    // Question template bank callbacks
    onSaveToNewQuestionTemplateBank: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingQuestionTemplateBank: (questionTemplateBankId: string) => void;

    // Loading states
    isLoadingAssessmentTemplate?: boolean;
    isLoadingQuestionTemplateBank?: boolean;

    // Pre-selection
    preSelectedAssessmentTemplateId?: string;
    preSelectedQuestionTemplateBankId?: string;

    // Optional: Skip destination choice
    initialView?: ModalView;
}

export function SaveTemplateModal({
    open,
    onOpenChange,
    ownerId,
    currentFolderId,
    onSaveToNewAssessmentTemplate,
    onSaveToExistingAssessmentTemplate,
    onSaveToNewQuestionTemplateBank,
    onSaveToExistingQuestionTemplateBank,
    isLoadingAssessmentTemplate,
    isLoadingQuestionTemplateBank,
    preSelectedAssessmentTemplateId,
    preSelectedQuestionTemplateBankId,
    initialView = "destination",
}: SaveTemplateModalProps) {
    // View navigation
    const [currentView, setCurrentView] = useState<ModalView>(initialView);
    const [assessmentTemplateMode, setAssessmentTemplateMode] = useState<SubMode>("select");
    const [questionTemplateBankMode, setQuestionTemplateBankMode] = useState<SubMode>("select");

    // Assessment template creation state
    const [assessmentTemplateTitle, setAssessmentTemplateTitle] = useState("");
    const [assessmentTemplateDescription, setAssessmentTemplateDescription] = useState("");
    const [assessmentTemplateFolderId, setAssessmentTemplateFolderId] = useState<string>(currentFolderId);

    // Question template bank creation state
    const [questionTemplateBankTitle, setQuestionTemplateBankTitle] = useState("");
    const [questionTemplateBankDescription, setQuestionTemplateBankDescription] = useState("");
    const [questionTemplateBankFolderId, setQuestionTemplateBankFolderId] = useState<string>(currentFolderId);

    // Data fetching
    const { data: assessmentTemplates, isLoading: loadingAssessmentTemplates } = useAssessmentTemplates(
        open && currentView === "assessment-template" ? ownerId : undefined,
    );

    const { data: questionTemplateBanks, isLoading: loadingQuestionTemplateBanks } = useQuestionTemplateBanks(
        open && currentView === "question-template-bank" ? ownerId : undefined,
    );

    const { data: folders } = useFolders(
        open && (assessmentTemplateMode === "create" || questionTemplateBankMode === "create") ? {} : undefined,
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
        setAssessmentTemplateMode("select");
        setQuestionTemplateBankMode("select");
        setAssessmentTemplateTitle("");
        setAssessmentTemplateDescription("");
        setAssessmentTemplateFolderId(currentFolderId);
        setQuestionTemplateBankTitle("");
        setQuestionTemplateBankDescription("");
        setQuestionTemplateBankFolderId(currentFolderId);
    };

    const handleSaveToNewAssessmentTemplate = () => {
        if (!assessmentTemplateTitle.trim() || !assessmentTemplateFolderId) return;
        onSaveToNewAssessmentTemplate(
            assessmentTemplateTitle.trim(),
            assessmentTemplateDescription.trim() || undefined,
            assessmentTemplateFolderId,
        );
    };

    const handleSaveToNewQuestionTemplateBank = () => {
        if (!questionTemplateBankTitle.trim() || !questionTemplateBankFolderId) return;
        onSaveToNewQuestionTemplateBank(
            questionTemplateBankTitle.trim(),
            questionTemplateBankDescription.trim() || undefined,
            questionTemplateBankFolderId,
        );
    };

    // Dynamic modal content
    const getModalContent = () => {
        if (currentView === "destination") {
            return {
                title: "Save Question Template",
                description: "Choose where to save this question template",
            };
        }

        if (currentView === "assessment-template") {
            return assessmentTemplateMode === "select"
                ? {
                      title: "Save Question Template",
                      description: "Choose where to save this question template.",
                  }
                : {
                      title: "Create New Assessment Template",
                      description: "Create a new assessment template to save this question template to.",
                  };
        }

        // currentView === "question-template-bank"
        return questionTemplateBankMode === "select"
            ? {
                  title: "Save Question Template",
                  description: "Choose where to save this question template.",
              }
            : {
                  title: "Create New Question Template Bank",
                  description: "Create a new question template bank to save this question template to.",
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
                            onClick={() => setCurrentView("assessment-template")}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <FileText className="h-6 w-6 text-primary mt-0.5" />
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-base">
                                            Save to Assessment Template
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Add to a quiz, test, or exam template
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCurrentView("question-template-bank")}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Database className="h-6 w-6 text-primary mt-0.5" />
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-base">
                                            Save to Question Template Bank
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Add to a reusable question template library
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Assessment Template View */}
                {currentView === "assessment-template" && (
                    <>
                        {assessmentTemplateMode === "select" && (
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
                                        onClick={() => setAssessmentTemplateMode("create")}
                                    >
                                        <div className="flex items-start gap-4">
                                            <Plus className="h-5 w-5 mt-0.5 text-primary" />
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    Create New Assessment Template
                                                </div>
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

                                    {assessmentTemplates && (
                                        <AssessmentTemplateBrowser
                                            templates={assessmentTemplates}
                                            isLoading={loadingAssessmentTemplates}
                                            onSelectTemplate={onSaveToExistingAssessmentTemplate}
                                            disabled={isLoadingAssessmentTemplate}
                                            preSelectedTemplateId={preSelectedAssessmentTemplateId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {assessmentTemplateMode === "create" && (
                            <CreateAssessmentTemplateBankForm
                                title={assessmentTemplateTitle}
                                description={assessmentTemplateDescription}
                                selectedFolderId={assessmentTemplateFolderId}
                                folders={folders}
                                onTitleChange={setAssessmentTemplateTitle}
                                onDescriptionChange={setAssessmentTemplateDescription}
                                onFolderChange={setAssessmentTemplateFolderId}
                                onSubmit={handleSaveToNewAssessmentTemplate}
                                onCancel={() => setAssessmentTemplateMode("select")}
                                isLoading={isLoadingAssessmentTemplate}
                                showBackButton
                            />
                        )}
                    </>
                )}

                {/* Question Template Bank View */}
                {currentView === "question-template-bank" && (
                    <>
                        {questionTemplateBankMode === "select" && (
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
                                        onClick={() => setQuestionTemplateBankMode("create")}
                                    >
                                        <div className="flex items-start gap-4">
                                            <Plus className="h-5 w-5 mt-0.5 text-primary" />
                                            <div className="text-left">
                                                <div className="font-medium">
                                                    Create New Question Template Bank
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Start a new question template bank to hold this and
                                                    future templates
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
                                                or add to existing template bank
                                            </span>
                                        </div>
                                    </div>

                                    {questionTemplateBanks && (
                                        <QuestionTemplateBankBrowser
                                            questionTemplateBanks={questionTemplateBanks}
                                            isLoading={loadingQuestionTemplateBanks}
                                            onSelectQuestionTemplateBank={onSaveToExistingQuestionTemplateBank}
                                            disabled={isLoadingQuestionTemplateBank}
                                            preSelectedQuestionTemplateBankId={preSelectedQuestionTemplateBankId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {questionTemplateBankMode === "create" && (
                            <CreateQuestionTemplateBankForm
                                title={questionTemplateBankTitle}
                                description={questionTemplateBankDescription}
                                selectedFolderId={questionTemplateBankFolderId}
                                folders={folders}
                                onTitleChange={setQuestionTemplateBankTitle}
                                onDescriptionChange={setQuestionTemplateBankDescription}
                                onFolderChange={setQuestionTemplateBankFolderId}
                                onSubmit={handleSaveToNewQuestionTemplateBank}
                                onCancel={() => setQuestionTemplateBankMode("select")}
                                isLoading={isLoadingQuestionTemplateBank}
                                showBackButton
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
