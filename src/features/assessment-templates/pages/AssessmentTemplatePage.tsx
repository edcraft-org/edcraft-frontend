// AssessmentTemplatePage - View and manage assessment template with question templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/router";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { isAbortError } from "@/api/pollJob";
import { useUserStore } from "@/shared/stores/user.store";
import { ResourcePath } from "@/api/models";
import {
    AddResourceButton,
    CollaborationModal,
    DeleteConfirmationDialog,
    ReorderButton,
    CollectionPage,
    ShareResourceButton,
} from "@/shared/components";
import { queryKeys } from "@/api";
import {
    AddQuestionTemplateModal,
    CreateFromTemplateModal,
    QuestionTemplateList,
    useQuestionTemplateSourceNavigation,
} from "@/features/question-templates";
import { InstantiateAssessmentModal } from "../components";
import {
    useAddQuestionTemplateToAssessmentTemplate,
    useLinkQuestionTemplateToAssessmentTemplate,
    useRemoveQuestionTemplateFromAssessmentTemplate,
    useAssessmentTemplate,
    useGenerateAssessmentFromTemplate,
    useReorderQuestionTemplatesInAssessmentTemplate,
    useSyncQuestionTemplateInAssessmentTemplate,
    useUnlinkQuestionTemplateInAssessmentTemplate,
    useUpdateAssessmentTemplate,
} from "../hooks/useAssessmentTemplates";
import type { CreateQuestionTemplateRequest, QuestionTemplateResponse } from "@/api/models";
import { canEditResource, notifyMutationError } from "@/shared/utils/resourceUtils";
import { questionTemplateResponseToCreateRequest } from "@/shared/utils/questionTemplateUtils";
import { LinkOrDuplicateDialog } from "@/shared/components/resources";

function AssessmentTemplatePage() {
    const { templateId } = useParams<{ templateId: string }>();
    const assessmentTemplateResourceId = templateId ?? "";
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplateResponse | null>(null);
    const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
    const [showInstantiateDialog, setShowInstantiateDialog] = useState(false);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [reorderedTemplates, setReorderedTemplates] = useState<QuestionTemplateResponse[]>([]);
    const [showCollabModal, setShowCollabModal] = useState(false);

    const { data: assessmentTemplate, isLoading } = useAssessmentTemplate(
        assessmentTemplateResourceId,
    );

    const myRole = assessmentTemplate?.my_role ?? null;
    const canEdit = canEditResource(myRole);

    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
    const linkQuestionTemplate = useLinkQuestionTemplateToAssessmentTemplate();
    const removeQuestionTemplate = useRemoveQuestionTemplateFromAssessmentTemplate();
    const generateAssessment = useGenerateAssessmentFromTemplate();
    const reorderMutation = useReorderQuestionTemplatesInAssessmentTemplate();
    const syncQuestionTemplate = useSyncQuestionTemplateInAssessmentTemplate();
    const unlinkQuestionTemplate = useUnlinkQuestionTemplateInAssessmentTemplate();
    const updateTemplate = useUpdateAssessmentTemplate();
    const navigateToTemplateSource = useQuestionTemplateSourceNavigation(navigate);

    const sortedTemplates = useMemo(
        () =>
            [...(assessmentTemplate?.question_templates ?? [])].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0),
            ),
        [assessmentTemplate?.question_templates],
    );

    // Validation Helpers
    const validateSession = (): { templateId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { templateId: assessmentTemplateResourceId, userId: user.id };
    };

    const validateTemplateSelected = (
        template: QuestionTemplateResponse | null,
    ): QuestionTemplateResponse | null => {
        if (!template) {
            toast.error("No template selected");
            return null;
        }
        return template;
    };

    // Reusable error handler for mutations
    const handleMutationError = (error: Error, operationName: string) => {
        toast.error(notifyMutationError(error, operationName));
    };

    // Mutation Handlers

    // Adds a new question template to the assessment template
    const handleAddQuestionTemplateMutation = (
        templateId: string,
        templateData: CreateQuestionTemplateRequest,
        successMessage: string,
        onSuccess: () => void,
    ) => {
        addQuestionTemplate.mutate(
            {
                templateId,
                data: {
                    question_template: {
                        ...templateData,
                    },
                },
            },
            {
                onSuccess: () => {
                    toast.success(successMessage);
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "add template"),
            },
        );
    };

    // Links an existing question template to the assessment template
    const handleLinkQuestionTemplateMutation = (
        templateId: string,
        questionTemplateId: string,
        onSuccess: () => void,
    ) => {
        linkQuestionTemplate.mutate(
            {
                templateId,
                data: { question_template_id: questionTemplateId },
            },
            {
                onSuccess: () => {
                    toast.success("Question template linked successfully");
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "link template"),
            },
        );
    };

    // Removes a question template from the assessment template
    const handleRemoveQuestionTemplateMutation = (
        templateId: string,
        questionTemplateId: string,
        onSuccess: () => void,
    ) => {
        removeQuestionTemplate.mutate(
            {
                templateId,
                questionTemplateId,
            },
            {
                onSuccess: () => {
                    toast.success("Question template removed from assessment template");
                    onSuccess();
                },
                onError: (error) => handleMutationError(error, "remove template"),
            },
        );
    };

    // UI Event Handlers

    const handleCreateQuestion = (template: QuestionTemplateResponse) => {
        setSelectedTemplate(template);
        setShowCreateFromTemplate(true);
    };

    const handleEditTemplate = (template: QuestionTemplateResponse) => {
        setSelectedTemplate(template);
        navigate(`${ROUTES.TEMPLATE_BUILDER}?templateId=${template.id}`);
    };

    const handleSelectExisting = (template: QuestionTemplateResponse) => {
        setSelectedTemplate(template);
        setShowLinkOrDuplicateModal(true);
    };

    const handleLinkTemplate = () => {
        if (linkQuestionTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleLinkQuestionTemplateMutation(session.templateId, template.id, () => {
            setShowLinkOrDuplicateModal(false);
            setSelectedTemplate(null);
        });
    };

    const handleDuplicateTemplate = (templateParam?: QuestionTemplateResponse) => {
        if (addQuestionTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = templateParam || validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleAddQuestionTemplateMutation(
            session.templateId,
            questionTemplateResponseToCreateRequest(template),
            "Question template duplicated successfully",
            () => {
                setShowLinkOrDuplicateModal(false);
                setSelectedTemplate(null);
            },
        );
    };

    const handleRemoveTemplate = () => {
        if (removeQuestionTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleRemoveQuestionTemplateMutation(session.templateId, template.id, () => {
            setShowRemoveDialog(false);
            setSelectedTemplate(null);
        });
    };

    const handleSyncTemplate = (template: QuestionTemplateResponse) => {
        if (syncQuestionTemplate.isPending) return;
        const session = validateSession();
        if (!session) return;
        syncQuestionTemplate.mutate(
            { templateId: session.templateId, questionTemplateId: template.id },
            {
                onSuccess: () => toast.success("Question template synced from source"),
                onError: (error) => handleMutationError(error, "sync template"),
            },
        );
    };

    const handleUnlinkTemplate = (template: QuestionTemplateResponse) => {
        if (unlinkQuestionTemplate.isPending) return;
        const session = validateSession();
        if (!session) return;
        unlinkQuestionTemplate.mutate(
            { templateId: session.templateId, questionTemplateId: template.id },
            {
                onSuccess: () => toast.success("Question template unlinked"),
                onError: (error) => handleMutationError(error, "unlink template"),
            },
        );
    };

    const handleInstantiate = async (
        title: string,
        description: string | undefined,
        questionInputs: Array<Record<string, unknown>>,
    ) => {
        if (!user || !assessmentTemplate) return;

        try {
            const newAssessment = await generateAssessment.mutateAsync({
                templateId: assessmentTemplate.id,
                data: {
                    assessment_metadata: {
                        owner_id: user.id,
                        folder_id: assessmentTemplate.folder_id,
                        title,
                        description,
                    },
                    question_inputs: questionInputs,
                },
            });
            toast.success("Assessment created successfully");
            navigate(ROUTES.ASSESSMENT(newAssessment.id));
        } catch (error) {
            if (isAbortError(error)) return;
            throw error;
        }
    };

    // Handle reordering templates
    const handleReorder = (newOrder: QuestionTemplateResponse[]) => {
        setReorderedTemplates(newOrder);
    };

    const handleSaveReorder = () => {
        if (reorderMutation.isPending) return;

        const session = validateSession();
        if (!session) return;

        const templateOrders = reorderedTemplates.map((t, index) => ({
            question_template_id: t.id,
            order: index + 1,
        }));

        reorderMutation.mutate(
            {
                templateId: assessmentTemplateResourceId,
                data: { question_template_orders: templateOrders },
            },
            {
                onSuccess: () => {
                    toast.success("Templates reordered successfully");
                    setIsReorderMode(false);
                    setReorderedTemplates([]);
                },
                onError: (error) => handleMutationError(error, "reorder templates"),
            },
        );
    };

    return (
        <CollectionPage
            resourceId={assessmentTemplateResourceId}
            resource={assessmentTemplate}
            isLoading={isLoading}
            messages={{
                missingResource: "Template ID is missing",
                notFound: "Assessment template not found",
            }}
            onBack={(assessmentTemplate) =>
                navigate(ROUTES.FOLDER(assessmentTemplate.folder_id))
            }
            actions={() => (
                <>
                    {!isReorderMode && (
                        <Button variant="outline" onClick={() => setShowInstantiateDialog(true)}>
                            <Play className="h-4 w-4 mr-2" />
                            Instantiate Assessment
                        </Button>
                    )}
                    {canEdit && !isReorderMode && (
                        <>
                            <ShareResourceButton onClick={() => setShowCollabModal(true)} />
                            <ReorderButton
                                isReorderMode={false}
                                onStart={() => {
                                    setIsReorderMode(true);
                                    setReorderedTemplates(sortedTemplates);
                                }}
                            />
                            <AddResourceButton
                                label="Add Template"
                                onClick={() => setShowAddTemplateModal(true)}
                            />
                        </>
                    )}
                    {canEdit && isReorderMode && (
                        <ReorderButton
                            isReorderMode
                            isSaving={reorderMutation.isPending}
                            onCancel={() => {
                                setIsReorderMode(false);
                                setReorderedTemplates([]);
                            }}
                            onSave={handleSaveReorder}
                        />
                    )}
                </>
            )}
        >
            {(assessmentTemplate) => (
                <>
                    <QuestionTemplateList
                        templates={isReorderMode ? reorderedTemplates : sortedTemplates}
                        onCreateQuestion={handleCreateQuestion}
                        onEdit={handleEditTemplate}
                        onDuplicate={handleDuplicateTemplate}
                        onRemove={(template) => {
                            setSelectedTemplate(template);
                            setShowRemoveDialog(true);
                        }}
                        isReorderMode={isReorderMode}
                        onReorder={handleReorder}
                        onSync={handleSyncTemplate}
                        onGoToSource={navigateToTemplateSource}
                        onUnlink={handleUnlinkTemplate}
                        canEdit={canEdit}
                    />

                    {user && (
                        <AddQuestionTemplateModal
                            open={showAddTemplateModal}
                            onOpenChange={setShowAddTemplateModal}
                            destination={{
                                type: "assessmentTemplate",
                                id: assessmentTemplateResourceId,
                            }}
                            ownerId={user.id}
                            onSelectExisting={handleSelectExisting}
                        />
                    )}

                    <CreateFromTemplateModal
                        open={showCreateFromTemplate}
                        onOpenChange={setShowCreateFromTemplate}
                        template={selectedTemplate}
                        canEdit={canEdit}
                    />

                    <LinkOrDuplicateDialog
                        open={showLinkOrDuplicateModal}
                        onOpenChange={setShowLinkOrDuplicateModal}
                        onLink={handleLinkTemplate}
                        onDuplicate={handleDuplicateTemplate}
                        isLoading={linkQuestionTemplate.isPending || addQuestionTemplate.isPending}
                    />
                        
                    <InstantiateAssessmentModal
                        open={showInstantiateDialog}
                        onOpenChange={setShowInstantiateDialog}
                        assessmentTemplateTitle={assessmentTemplate.title}
                        questionTemplates={assessmentTemplate.question_templates ?? []}
                        onInstantiate={handleInstantiate}
                        onCancelGeneration={generateAssessment.cancel}
                        isLoading={generateAssessment.isPending}
                        canEdit={canEdit}
                    />

                    <DeleteConfirmationDialog
                        open={showRemoveDialog}
                        onOpenChange={setShowRemoveDialog}
                        onConfirm={handleRemoveTemplate}
                        isLoading={removeQuestionTemplate.isPending}
                        resourceName="question template"
                    />

                    {myRole && (
                        <CollaborationModal
                            resourcePath={ResourcePath["assessment-templates"]}
                            resourceId={assessmentTemplateResourceId}
                            isOpen={showCollabModal}
                            onOpenChange={setShowCollabModal}
                            myRole={myRole}
                            currentVisibility={assessmentTemplate.visibility}
                            onVisibilityChange={(visibility) =>
                                updateTemplate.mutate({
                                    templateId: assessmentTemplateResourceId,
                                    data: { visibility },
                                    oldFolderId: assessmentTemplate.folder_id,
                                })
                            }
                            isVisibilityUpdating={updateTemplate.isPending}
                            resourceDetailQueryKey={queryKeys.assessmentTemplates.detail(
                                assessmentTemplateResourceId,
                            )}
                        />
                    )}
                </>
            )}
        </CollectionPage>
    );
}

export default AssessmentTemplatePage;
