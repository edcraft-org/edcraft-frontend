// QuestionBankPage - View and manage question bank questions

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
    useQuestionBank,
    useAddQuestionToQuestionBank,
    useLinkQuestionToQuestionBank,
    useRemoveQuestionFromQuestionBank,
} from "./useQuestionBanks";
import { QuestionsList, RemoveQuestionDialog } from "@/features/assessments/components";
import {
    EditQuestionModal,
    AddQuestionModal,
    LinkOrDuplicateModal,
    useUpdateQuestion,
} from "@/features/questions";
import type { QuestionResponse, QuestionEditorData } from "@/types/frontend.types";
import type { CreateMCQRequest, CreateMRQRequest, CreateShortAnswerRequest } from "@/api/models";
import { questionResponseToRequestData } from "@/shared/utils/questionUtils";

function QuestionBankPage() {
    const { questionBankId } = useParams<{ questionBankId: string }>();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);

    const { data: questionBank, isLoading } = useQuestionBank(questionBankId || "");

    const addQuestion = useAddQuestionToQuestionBank();
    const linkQuestion = useLinkQuestionToQuestionBank();
    const removeQuestion = useRemoveQuestionFromQuestionBank();
    const updateQuestion = useUpdateQuestion();

    const sortedQuestions = useMemo(
        () =>
            [...(questionBank?.questions ?? [])].sort(
                (a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime(),
            ),
        [questionBank?.questions],
    );

    if (!questionBankId) {
        return (
            <div className="p-6 text-center text-muted-foreground">Question bank ID is missing</div>
        );
    }

    // Validation Helpers
    const validateSession = (): { questionBankId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { questionBankId, userId: user.id };
    };

    const validateQuestionSelected = (
        question: QuestionResponse | null,
    ): QuestionResponse | null => {
        if (!question) {
            toast.error("No question selected");
            return null;
        }
        return question;
    };

    // Reusable error handler for mutations
    const handleMutationError = (error: Error, operationName: string) => {
        toast.error(`Failed to ${operationName}: ${error.message}`);
    };

    // Mutation Handlers

    // Adds a new question to the question bank
    const handleAddQuestionMutation = (
        questionBankId: string,
        questionData: QuestionEditorData & { template_id?: string | null },
        successMessage: string,
        onSuccess: () => void,
    ) => {
        addQuestion.mutate(
            {
                questionBankId,
                data: {
                    question: questionData as
                        | CreateMCQRequest
                        | CreateMRQRequest
                        | CreateShortAnswerRequest,
                },
            },
            {
                onSuccess: () => {
                    toast.success(successMessage);
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "add question"),
            },
        );
    };

    // Links an existing question to the question bank
    const handleLinkQuestionMutation = (
        questionBankId: string,
        questionId: string,
        onSuccess: () => void,
    ) => {
        linkQuestion.mutate(
            {
                questionBankId,
                data: { question_id: questionId },
            },
            {
                onSuccess: () => {
                    toast.success("Question linked successfully");
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "link question"),
            },
        );
    };

    // Removes a question from the question bank
    const handleRemoveQuestionMutation = (
        questionBankId: string,
        questionId: string,
        onSuccess: () => void,
    ) => {
        removeQuestion.mutate(
            {
                questionBankId,
                questionId,
            },
            {
                onSuccess: () => {
                    toast.success("Question removed from question bank");
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "remove question"),
            },
        );
    };

    // UI Event Handlers

    const handleSelectExisting = (question: QuestionResponse) => {
        setSelectedQuestion(question);
        setShowLinkOrDuplicateModal(true);
    };

    const handleSaveNewQuestion = (data: QuestionEditorData) => {
        if (addQuestion.isPending) return;

        const session = validateSession();
        if (!session) return;

        handleAddQuestionMutation(session.questionBankId, data, "Question added successfully", () =>
            setShowAddModal(false),
        );
    };

    const handleLinkQuestion = () => {
        if (linkQuestion.isPending) return;

        const session = validateSession();
        if (!session) return;

        const question = validateQuestionSelected(selectedQuestion);
        if (!question) return;

        handleLinkQuestionMutation(session.questionBankId, question.id, () => {
            setShowLinkOrDuplicateModal(false);
            setSelectedQuestion(null);
        });
    };

    const handleDuplicateQuestion = (questionParam?: QuestionResponse) => {
        if (addQuestion.isPending) return;

        const session = validateSession();
        if (!session) return;

        const question = questionParam || validateQuestionSelected(selectedQuestion);
        if (!question) return;

        const requestData = questionResponseToRequestData(question);
        handleAddQuestionMutation(
            session.questionBankId,
            {
                ...requestData,
                template_id: question.template_id,
            },
            "Question duplicated successfully",
            () => {
                setShowLinkOrDuplicateModal(false);
                setSelectedQuestion(null);
            },
        );
    };

    const handleRemoveQuestion = () => {
        if (removeQuestion.isPending) return;

        const session = validateSession();
        if (!session) return;

        const question = validateQuestionSelected(selectedQuestion);
        if (!question) return;

        handleRemoveQuestionMutation(session.questionBankId, question.id, () => {
            setShowRemoveDialog(false);
            setSelectedQuestion(null);
        });
    };

    // Handle editing a question
    const handleEditQuestion = (question: QuestionResponse) => {
        setSelectedQuestion(question);
        setShowEditModal(true);
    };

    // Handle updating an edited question
    const handleSaveEditedQuestion = (data: QuestionEditorData) => {
        if (updateQuestion.isPending) return;

        const question = validateQuestionSelected(selectedQuestion);
        if (!question) return;

        updateQuestion.mutate(
            {
                questionId: question.id,
                data: {
                    question_type: data.question_type,
                    question_text: data.question_text,
                    data: data.data,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Question updated successfully");
                    setShowEditModal(false);
                    setSelectedQuestion(null);
                },
                onError: (error) => handleMutationError(error, "update question"),
            },
        );
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!questionBank) {
        return <div className="p-6 text-center text-muted-foreground">Question bank not found</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/folders/${questionBank.folder_id}`)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{questionBank.title}</h1>
                    {questionBank.description && (
                        <p className="text-muted-foreground mt-1">{questionBank.description}</p>
                    )}
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                </Button>
            </div>

            <QuestionsList
                questions={sortedQuestions}
                onEdit={handleEditQuestion}
                onDuplicate={handleDuplicateQuestion}
                onRemove={(question) => {
                    setSelectedQuestion(question);
                    setShowRemoveDialog(true);
                }}
            />

            {user && (
                <AddQuestionModal
                    open={showAddModal}
                    onOpenChange={setShowAddModal}
                    assessmentId={questionBankId}
                    ownerId={user.id}
                    onSaveQuestion={handleSaveNewQuestion}
                    onSelectExisting={handleSelectExisting}
                    isSaving={addQuestion.isPending}
                />
            )}

            <EditQuestionModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                question={selectedQuestion}
                onSave={handleSaveEditedQuestion}
                isLoading={updateQuestion.isPending}
            />

            {user && (
                <LinkOrDuplicateModal
                    open={showLinkOrDuplicateModal}
                    onOpenChange={setShowLinkOrDuplicateModal}
                    question={selectedQuestion}
                    ownerId={user.id}
                    onLink={handleLinkQuestion}
                    onDuplicate={handleDuplicateQuestion}
                    isLoading={linkQuestion.isPending || addQuestion.isPending}
                />
            )}

            <RemoveQuestionDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                onConfirm={handleRemoveQuestion}
                isLoading={removeQuestion.isPending}
            />
        </div>
    );
}

export default QuestionBankPage;
