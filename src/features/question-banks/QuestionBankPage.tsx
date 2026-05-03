// QuestionBankPage - View and manage question bank questions

import { useState, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserStore } from "@/shared/stores/user.store";
import { ResourcePath } from "@/api/models";
import {
    AddResourceButton,
    CollaborationModal,
    DeleteConfirmationDialog,
    ResourceCollectionPage,
    ShareResourceButton,
} from "@/shared/components";
import { queryKeys } from "@/api";
import { ROUTES } from "@/router/paths";
import {
    useQuestionBank,
    useAddQuestionToQuestionBank,
    useLinkQuestionToQuestionBank,
    useRemoveQuestionFromQuestionBank,
    useSyncQuestionInQuestionBank,
    useUnlinkQuestionInQuestionBank,
    useUpdateQuestionBank,
} from "./useQuestionBanks";
import {
    EditQuestionModal,
    AddQuestionModal,
    LinkOrDuplicateModal,
    QuestionList,
    useQuestionSourceNavigation,
    useUpdateQuestion,
} from "@/features/questions";
import type { QuestionResponse, QuestionEditorData } from "@/types/frontend.types";
import type { CreateMCQRequest, CreateMRQRequest, CreateShortAnswerRequest } from "@/api/models";
import { questionResponseToRequestData } from "@/shared/utils/questionUtils";
import { canEditResource, notifyMutationError } from "@/shared/utils/resourceUtils";
const CanvasExportModal = lazy(() =>
    import("@/features/canvas/components/CanvasExportModal").then((m) => ({
        default: m.CanvasExportModal,
    })),
);

function QuestionBankPage() {
    const { questionBankId } = useParams<{ questionBankId: string }>();
    const questionBankResourceId = questionBankId ?? "";
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
    const [showCanvasExport, setShowCanvasExport] = useState(false);
    const [canvasQuestions, setCanvasQuestions] = useState<QuestionResponse[]>([]);
    const [showCollabModal, setShowCollabModal] = useState(false);

    const { data: questionBank, isLoading } = useQuestionBank(questionBankResourceId);

    const myRole = questionBank?.my_role ?? null;
    const canEdit = canEditResource(myRole);

    const addQuestion = useAddQuestionToQuestionBank();
    const linkQuestion = useLinkQuestionToQuestionBank();
    const removeQuestion = useRemoveQuestionFromQuestionBank();
    const syncQuestion = useSyncQuestionInQuestionBank();
    const unlinkQuestion = useUnlinkQuestionInQuestionBank();
    const updateQuestion = useUpdateQuestion();
    const updateQuestionBank = useUpdateQuestionBank();
    const navigateToQuestionSource = useQuestionSourceNavigation(navigate);

    const sortedQuestions = useMemo(
        () =>
            [...(questionBank?.questions ?? [])].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            ),
        [questionBank?.questions],
    );

    // Validation Helpers
    const validateSession = (): { questionBankId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { questionBankId: questionBankResourceId, userId: user.id };
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

    const handleAddToCanvas = (question: QuestionResponse) => {
        setCanvasQuestions([question]);
        setShowCanvasExport(true);
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

    const handleSyncQuestion = (question: QuestionResponse) => {
        syncQuestion.mutate(
            { questionBankId: questionBankResourceId, questionId: question.id },
            {
                onSuccess: () => toast.success("Question synced from source"),
                onError: (error) => handleMutationError(error, "sync question"),
            },
        );
    };

    const handleUnlinkQuestion = (question: QuestionResponse) => {
        unlinkQuestion.mutate(
            { questionBankId: questionBankResourceId, questionId: question.id },
            {
                onSuccess: () => toast.success("Question unlinked"),
                onError: (error) => handleMutationError(error, "unlink question"),
            },
        );
    };

    return (
        <ResourceCollectionPage
            resourceId={questionBankResourceId}
            resource={questionBank}
            isLoading={isLoading}
            messages={{
                missingResource: "Question bank ID is missing",
                notFound: "Question bank not found",
            }}
            onBack={(questionBank) => navigate(ROUTES.FOLDER(questionBank.folder_id))}
            actions={() =>
                canEdit ? (
                    <>
                        <ShareResourceButton onClick={() => setShowCollabModal(true)} />
                        <AddResourceButton
                            label="Add Question"
                            onClick={() => setShowAddModal(true)}
                        />
                    </>
                ) : undefined
            }
        >
            {(questionBank) => (
                <>
                    <QuestionList
                        questions={sortedQuestions}
                        onEdit={handleEditQuestion}
                        onDuplicate={handleDuplicateQuestion}
                        onRemove={(question) => {
                            setSelectedQuestion(question);
                            setShowRemoveDialog(true);
                        }}
                        onAddToCanvas={handleAddToCanvas}
                        onSync={handleSyncQuestion}
                        onUnlink={handleUnlinkQuestion}
                        onGoToSource={navigateToQuestionSource}
                        canEdit={canEdit}
                    />

                    {user && (
                        <AddQuestionModal
                            open={showAddModal}
                            onOpenChange={setShowAddModal}
                            assessmentId={questionBankResourceId}
                            ownerId={user.id}
                            onSaveQuestion={handleSaveNewQuestion}
                            onSelectExisting={handleSelectExisting}
                            isSaving={addQuestion.isPending}
                            destinationType="questionBank"
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

                    <Suspense>
                        <CanvasExportModal
                            open={showCanvasExport}
                            onOpenChange={setShowCanvasExport}
                            questions={canvasQuestions}
                            mode="question"
                        />
                    </Suspense>

                    {myRole && (
                        <CollaborationModal
                            resourcePath={ResourcePath["question-banks"]}
                            resourceId={questionBankResourceId}
                            isOpen={showCollabModal}
                            onOpenChange={setShowCollabModal}
                            myRole={myRole}
                            currentVisibility={questionBank.visibility}
                            onVisibilityChange={(visibility) =>
                                updateQuestionBank.mutate({
                                    questionBankId: questionBankResourceId,
                                    data: { visibility },
                                    oldFolderId: questionBank.folder_id,
                                })
                            }
                            isVisibilityUpdating={updateQuestionBank.isPending}
                            resourceDetailQueryKey={queryKeys.questionBanks.detail(
                                questionBankResourceId,
                            )}
                        />
                    )}
                </>
            )}
        </ResourceCollectionPage>
    );
}

export default QuestionBankPage;
