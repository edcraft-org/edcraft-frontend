// AddQuestionModal - Modal for adding questions to an assessment

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wand2, PenLine, Search } from "lucide-react";
import { ROUTES } from "@/router/paths";
import type { CreateQuestionRequest } from "@/api/models";
import { QuestionBrowser } from "./QuestionBrowser";
import { QuestionEditor } from "./QuestionEditor";
import type {
    MultipleChoiceAdditionalData,
    ShortAnswerAdditionalData,
    QuestionType,
} from "@/types/frontend.types";

type ModalView = "options" | "browse" | "create";

interface AddQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentId: string;
    ownerId: string;
    onSaveQuestion: (data: {
        question_type: QuestionType;
        question_text: string;
        additional_data: MultipleChoiceAdditionalData | ShortAnswerAdditionalData;
    }) => void;
    onSelectExisting: (question: CreateQuestionRequest) => void;
    isSaving?: boolean;
}

export function AddQuestionModal({
    open,
    onOpenChange,
    assessmentId,
    ownerId,
    onSaveQuestion,
    onSelectExisting,
    isSaving = false,
}: AddQuestionModalProps) {
    const navigate = useNavigate();
    const [view, setView] = useState<ModalView>("options");

    const handleClose = () => {
        onOpenChange(false);
        setView("options");
    };

    const handleGenerateNew = () => {
        navigate(`${ROUTES.QUESTION_BUILDER}?destination=${assessmentId}`);
        handleClose();
    };

    const handleCreateManually = () => {
        setView("create");
    };

    const handleSelectQuestion = (question: CreateQuestionRequest) => {
        onSelectExisting(question);
        handleClose();
    };

    const handleSaveQuestion = (data: {
        question_type: QuestionType;
        question_text: string;
        additional_data: MultipleChoiceAdditionalData | ShortAnswerAdditionalData;
    }) => {
        onSaveQuestion(data);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {view === "options" && "Add Question"}
                        {view === "browse" && "Select Existing Question"}
                        {view === "create" && "Create Question"}
                    </DialogTitle>
                    <DialogDescription>
                        {view === "options" &&
                            "Choose how you want to add a question to this assessment."}
                        {view === "browse" &&
                            "Browse and select a question from your question bank."}
                        {view === "create" && "Create a new question to add to this assessment."}
                    </DialogDescription>
                </DialogHeader>

                {view === "options" && (
                    <div className="grid gap-3 py-4">
                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start"
                            onClick={handleGenerateNew}
                        >
                            <div className="flex items-start gap-4">
                                <Wand2 className="h-5 w-5 mt-0.5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium">Generate New Question</div>
                                    <div className="text-sm text-muted-foreground">
                                        Use the question builder to create a new question from code
                                    </div>
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start"
                            onClick={handleCreateManually}
                        >
                            <div className="flex items-start gap-4">
                                <PenLine className="h-5 w-5 mt-0.5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium">Create Manually</div>
                                    <div className="text-sm text-muted-foreground">
                                        Write a question by hand with custom options
                                    </div>
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 px-4 justify-start"
                            onClick={() => setView("browse")}
                        >
                            <div className="flex items-start gap-4">
                                <Search className="h-5 w-5 mt-0.5 text-primary" />
                                <div className="text-left">
                                    <div className="font-medium">Add Existing Question</div>
                                    <div className="text-sm text-muted-foreground">
                                        Browse and select from your question bank
                                    </div>
                                </div>
                            </div>
                        </Button>
                    </div>
                )}

                {view === "browse" && (
                    <QuestionBrowser
                        ownerId={ownerId}
                        onSelectQuestion={handleSelectQuestion}
                        onBack={() => setView("options")}
                    />
                )}

                {view === "create" && (
                    <QuestionEditor
                        onSave={handleSaveQuestion}
                        onCancel={() => setView("options")}
                        isLoading={isSaving}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
