// AssessmentPage - View and manage assessment questions

import { useState, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Upload, Users } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { ResourcePath } from "@/api/models";
import {
    CollaborationModal,
    DeleteConfirmationDialog,
    ResourcePageHeader,
} from "@/shared/components";
import { queryKeys } from "@/api";
import { ROUTES } from "@/router/paths";
import {
    useAssessment,
    useAddQuestionToAssessment,
    useLinkQuestionToAssessment,
    useSyncQuestionInAssessment,
    useUnlinkQuestionInAssessment,
    useRemoveQuestionFromAssessment,
    useReorderQuestions,
    useUpdateAssessment,
} from "./useAssessments";
import { QuestionsList, ExportButton } from "./components";
import {
    EditQuestionModal,
    AddQuestionModal,
    LinkOrDuplicateModal,
    useUpdateQuestion,
} from "@/features/questions";
import { getQuestion } from "@/features/questions/question.service";
import type { QuestionResponse, QuestionEditorData } from "@/types/frontend.types";
import type { CreateMCQRequest, CreateMRQRequest, CreateShortAnswerRequest } from "@/api/models";
import { questionResponseToRequestData } from "@/shared/utils/questionUtils";
import { canEditResource, notifyMutationError } from "@/shared/utils/resourceUtils";

const CanvasExportModal = lazy(() =>
    import("@/features/canvas/components/CanvasExportModal").then((m) => ({
        default: m.CanvasExportModal,
    })),
);

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
    const [showCanvasExport, setShowCanvasExport] = useState(false);
    const [canvasExportQuestions, setCanvasExportQuestions] = useState<QuestionResponse[]>([]);
    const [canvasExportMode, setCanvasExportMode] = useState<"assessment" | "question">(
        "assessment",
    );
    const [showCollabModal, setShowCollabModal] = useState(false);

    const { data: assessment, isLoading } = useAssessment(assessmentId || "");

    const myRole = assessment?.my_role ?? null;
    const canEdit = canEditResource(myRole);

    const addQuestion = useAddQuestionToAssessment();
    const linkQuestion = useLinkQuestionToAssessment();
    const syncQuestion = useSyncQuestionInAssessment();
    const unlinkQuestion = useUnlinkQuestionInAssessment();
    const removeQuestion = useRemoveQuestionFromAssessment();
    const updateQuestion = useUpdateQuestion();
    const reorderMutation = useReorderQuestions();
    const updateAssessment = useUpdateAssessment();

    const sortedQuestions = useMemo(
        () => [...(assessment?.questions ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
        toast.error(notifyMutationError(error, operationName));
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

    const handleSyncQuestion = (question: QuestionResponse) => {
        if (syncQuestion.isPending) return;
        const session = validateSession();
        if (!session) return;
        syncQuestion.mutate(
            { assessmentId: session.assessmentId, questionId: question.id },
            {
                onSuccess: () => toast.success("Question synced from source"),
                onError: (error) => handleMutationError(error, "sync question"),
            },
        );
    };

    const handleUnlinkQuestion = (question: QuestionResponse) => {
        if (unlinkQuestion.isPending) return;
        const session = validateSession();
        if (!session) return;
        unlinkQuestion.mutate(
            { assessmentId: session.assessmentId, questionId: question.id },
            {
                onSuccess: () => toast.success("Question unlinked"),
                onError: (error) => handleMutationError(error, "unlink question"),
            },
        );
    };

    const handleGoToSource = async (question: QuestionResponse) => {
        if (!question.linked_from_question_id) {
            toast.error("This question is not linked to any source");
            return;
        }

        try {
            const source = await getQuestion(question.linked_from_question_id);
            if (source.assessment_id) {
                navigate(ROUTES.ASSESSMENT(source.assessment_id));
            } else if (source.question_bank_id) {
                navigate(ROUTES.QUESTION_BANK(source.question_bank_id));
            }
        } catch {
            toast.error("Failed to navigate to source");
        }
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

    const handleAddToCanvas = (question: QuestionResponse) => {
        setCanvasExportQuestions([question]);
        setCanvasExportMode("question");
        setShowCanvasExport(true);
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
            <ResourcePageHeader
                title={assessment.title}
                description={assessment.description}
                onBack={() => navigate(ROUTES.FOLDER(assessment.folder_id))}
                actions={
                    <>
                        <ExportButton assessment={assessment} />
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCanvasExportQuestions(sortedQuestions);
                                setCanvasExportMode("assessment");
                                setShowCanvasExport(true);
                            }}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload to Canvas
                        </Button>
                        {canEdit && !isReorderMode && (
                            <>
                                <Button variant="outline" onClick={() => setShowCollabModal(true)}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
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
                        )}
                        {canEdit && isReorderMode && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsReorderMode(false);
                                        setReorderedQuestions([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveReorder}
                                    disabled={reorderMutation.isPending}
                                >
                                    {reorderMutation.isPending ? "Saving..." : "Save Order"}
                                </Button>
                            </>
                        )}
                    </>
                }
            />

            <QuestionsList
                questions={isReorderMode ? reorderedQuestions : sortedQuestions}
                onEdit={handleEditQuestion}
                onDuplicate={handleDuplicateQuestion}
                onRemove={(question) => {
                    setSelectedQuestion(question);
                    setShowRemoveDialog(true);
                }}
                onAddToCanvas={handleAddToCanvas}
                onSync={handleSyncQuestion}
                onUnlink={handleUnlinkQuestion}
                onGoToSource={handleGoToSource}
                isReorderMode={isReorderMode}
                onReorder={handleReorder}
                canEdit={canEdit}
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

            <LinkOrDuplicateModal
                open={showLinkOrDuplicateModal}
                onOpenChange={setShowLinkOrDuplicateModal}
                onLink={handleLinkQuestion}
                onDuplicate={handleDuplicateQuestion}
                isLoading={linkQuestion.isPending || addQuestion.isPending}
            />

            <DeleteConfirmationDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                onConfirm={handleRemoveQuestion}
                isLoading={removeQuestion.isPending}
                resourceName="question"
            />

            {myRole && (
                <CollaborationModal
                    resourcePath={ResourcePath.assessments}
                    resourceId={assessmentId}
                    isOpen={showCollabModal}
                    onOpenChange={setShowCollabModal}
                    myRole={myRole}
                    currentVisibility={assessment.visibility}
                    onVisibilityChange={(visibility) =>
                        updateAssessment.mutate({
                            assessmentId,
                            data: { visibility },
                            oldFolderId: assessment.folder_id,
                        })
                    }
                    isVisibilityUpdating={updateAssessment.isPending}
                    resourceDetailQueryKey={queryKeys.assessments.detail(assessmentId)}
                />
            )}

            <Suspense>
                <CanvasExportModal
                    open={showCanvasExport}
                    onOpenChange={setShowCanvasExport}
                    questions={canvasExportQuestions}
                    quizTitle={canvasExportMode === "assessment" ? assessment.title : undefined}
                    mode={canvasExportMode}
                />
            </Suspense>
        </div>
    );
}

export default AssessmentPage;
