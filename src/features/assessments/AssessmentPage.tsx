// AssessmentPage - View and manage assessment questions

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
    useAssessment,
    useAddQuestionToAssessment,
    useLinkQuestionToAssessment,
    useRemoveQuestionFromAssessment,
    useReorderQuestions,
} from "./useAssessments";
import { QuestionsList, RemoveQuestionDialog } from "./components";
import {
    EditQuestionModal,
    AddQuestionModal,
    LinkOrDuplicateModal,
    useUpdateQuestion,
} from "@/features/questions";
import type { QuestionResponse, QuestionEditorData } from "@/types/frontend.types";
import type { CreateMCQRequest, CreateMRQRequest, CreateShortAnswerRequest } from "@/api/models";
import { questionResponseToRequestData } from "@/shared/utils/questionUtils";

function AssessmentPage() {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [reorderedQuestions, setReorderedQuestions] = useState<QuestionResponse[]>([]);

    const { data: assessment, isLoading } = useAssessment(assessmentId || "");

    const addQuestion = useAddQuestionToAssessment();
    const linkQuestion = useLinkQuestionToAssessment();
    const removeQuestion = useRemoveQuestionFromAssessment();
    const updateQuestion = useUpdateQuestion();
    const reorderMutation = useReorderQuestions();

    const sortedQuestions = useMemo(
        () => [...(assessment?.questions ?? [])].sort((a, b) => a.order - b.order),
        [assessment?.questions],
    );

    if (!assessmentId) {
        return (
            <div className="p-6 text-center text-muted-foreground">Assessment ID is missing</div>
        );
    }

    // Validation Helpers
    const validateSession = (): { assessmentId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { assessmentId, userId: user.id };
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

    // Adds a new question to the assessment
    const handleAddQuestionMutation = (
        assessmentId: string,
        questionData: QuestionEditorData & { template_id?: string | null },
        successMessage: string,
        onSuccess: () => void,
    ) => {
        addQuestion.mutate(
            {
                assessmentId,
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

    // Links an existing question to the assessment
    const handleLinkQuestionMutation = (
        assessmentId: string,
        questionId: string,
        onSuccess: () => void,
    ) => {
        linkQuestion.mutate(
            {
                assessmentId,
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

    // Removes a question from the assessment
    const handleRemoveQuestionMutation = (
        assessmentId: string,
        questionId: string,
        onSuccess: () => void,
    ) => {
        removeQuestion.mutate(
            {
                assessmentId,
                questionId,
            },
            {
                onSuccess: () => {
                    toast.success("Question removed from assessment");
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

        handleAddQuestionMutation(session.assessmentId, data, "Question added successfully", () =>
            setShowAddModal(false),
        );
    };

    const handleLinkQuestion = () => {
        if (linkQuestion.isPending) return;

        const session = validateSession();
        if (!session) return;

        const question = validateQuestionSelected(selectedQuestion);
        if (!question) return;

        handleLinkQuestionMutation(session.assessmentId, question.id, () => {
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
            session.assessmentId,
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

        handleRemoveQuestionMutation(session.assessmentId, question.id, () => {
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

    // Handle reordering questions
    const handleReorder = (newOrder: QuestionResponse[]) => {
        setReorderedQuestions(newOrder);
    };

    const handleSaveReorder = () => {
        if (reorderMutation.isPending) return;

        const session = validateSession();
        if (!session) return;

        const questionOrders = reorderedQuestions.map((q, index) => ({
            question_id: q.id,
            order: index + 1,
        }));

        reorderMutation.mutate(
            {
                assessmentId: session.assessmentId,
                data: { question_orders: questionOrders },
            },
            {
                onSuccess: () => {
                    toast.success("Questions reordered successfully");
                    setIsReorderMode(false);
                    setReorderedQuestions([]);
                },
                onError: (error) => handleMutationError(error, "reorder questions"),
            },
        );
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!assessment) {
        return <div className="p-6 text-center text-muted-foreground">Assessment not found</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/folders/${assessment.folder_id}`)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{assessment.title}</h1>
                    {assessment.description && (
                        <p className="text-muted-foreground mt-1">{assessment.description}</p>
                    )}
                </div>
                {!isReorderMode ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReorderMode(true);
                                setReorderedQuestions(sortedQuestions);
                            }}
                        >
                            <GripVertical className="h-4 w-4 mr-2" />
                            Reorder
                        </Button>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReorderMode(false);
                                setReorderedQuestions([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveReorder} disabled={reorderMutation.isPending}>
                            {reorderMutation.isPending ? "Saving..." : "Save Order"}
                        </Button>
                    </div>
                )}
            </div>

            <QuestionsList
                questions={isReorderMode ? reorderedQuestions : sortedQuestions}
                onEdit={handleEditQuestion}
                onDuplicate={handleDuplicateQuestion}
                onRemove={(question) => {
                    setSelectedQuestion(question);
                    setShowRemoveDialog(true);
                }}
                isReorderMode={isReorderMode}
                onReorder={handleReorder}
            />

            {user && (
                <AddQuestionModal
                    open={showAddModal}
                    onOpenChange={setShowAddModal}
                    assessmentId={assessmentId}
                    ownerId={user.id}
                    onSaveQuestion={handleSaveNewQuestion}
                    onSelectExisting={handleSelectExisting}
                    isSaving={addQuestion.isPending}
                    destinationType="assessment"
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

export default AssessmentPage;
