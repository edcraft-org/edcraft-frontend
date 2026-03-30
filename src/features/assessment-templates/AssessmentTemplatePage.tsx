// AssessmentTemplatePage - View and manage assessment template with question templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/router";
import { getQuestionTemplate } from "@/features/question-templates/question-template.service";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus, GripVertical, Users } from "lucide-react";
import { isAbortError } from "@/api/pollJob";
import { useUserStore } from "@/shared/stores/user.store";
import { CollaboratorRole, ResourcePath } from "@/api/models";
import { CollaborationModal } from "@/shared/components";
import { queryKeys } from "@/api";
import {
    AddQuestionTemplateModal,
    LinkOrDuplicateTemplateModal,
} from "@/features/question-templates";
import type { CodeInfoOutput, CreateTargetElementRequest } from "@/api/models";
import { TextTemplateType } from "@/api/models";
import { InstantiateAssessmentModal, QuestionTemplatesList } from "./components";
import { DeleteConfirmationDialog } from "@/shared/components";
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
} from "./useAssessmentTemplates";
import type { QuestionTemplateResponse } from "@/api/models";
import { CreateFromTemplateModal } from "../question-templates/components";

function AssessmentTemplatePage() {
    const { templateId } = useParams<{ templateId: string }>();
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

    const { data: assessmentTemplate, isLoading } = useAssessmentTemplate(templateId || "");

    const myRole = assessmentTemplate?.my_role ?? null;
    const canEdit = myRole === CollaboratorRole.owner || myRole === CollaboratorRole.editor;

    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
    const linkQuestionTemplate = useLinkQuestionTemplateToAssessmentTemplate();
    const removeQuestionTemplate = useRemoveQuestionTemplateFromAssessmentTemplate();
    const generateAssessment = useGenerateAssessmentFromTemplate();
    const reorderMutation = useReorderQuestionTemplatesInAssessmentTemplate();
    const syncQuestionTemplate = useSyncQuestionTemplateInAssessmentTemplate();
    const unlinkQuestionTemplate = useUnlinkQuestionTemplateInAssessmentTemplate();
    const updateTemplate = useUpdateAssessmentTemplate();

    const sortedTemplates = useMemo(
        () =>
            [...(assessmentTemplate?.question_templates ?? [])].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0),
            ),
        [assessmentTemplate?.question_templates],
    );

    if (!templateId) {
        return <div className="p-6 text-center text-muted-foreground">Template ID is missing</div>;
    }

    // Validation Helpers
    const validateSession = (): { templateId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { templateId, userId: user.id };
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
        toast.error(`Failed to ${operationName}: ${error.message}`);
    };

    // Mutation Handlers

    // Adds a new question template to the assessment template
    const handleAddQuestionTemplateMutation = (
        templateId: string,
        templateData: {
            question_type: string;
            question_text_template: string;
            text_template_type: TextTemplateType;
            description?: string | undefined;
            code: string;
            code_info: CodeInfoOutput | undefined | null;
            entry_function: string;
            output_type: string;
            num_distractors: number;
            target_elements: CreateTargetElementRequest[];
        },
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

        // Convert target_elements: TargetElementResponse[] → CreateTargetElementRequest[]
        const targetElements = template.target_elements.map(
            ({ order: _, element_type, id_list, ...rest }) => ({
                element_type,
                id_list,
                ...rest,
            }),
        );

        handleAddQuestionTemplateMutation(
            session.templateId,
            {
                question_type: template.question_type,
                question_text_template: template.question_text_template,
                text_template_type: template.text_template_type,
                description: template.description ?? undefined,
                code: template.code,
                entry_function: template.entry_function,
                output_type: template.output_type,
                num_distractors: template.num_distractors,
                target_elements: targetElements,
                code_info: template.code_info,
            },
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

    const handleGoToTemplateSource = async (template: QuestionTemplateResponse) => {
        if (!template.linked_from_template_id) {
            toast.error("This template is not linked to any source");
            return;
        }
        try {
            const source = await getQuestionTemplate(template.linked_from_template_id);
            if (source.assessment_template_id) {
                navigate(ROUTES.ASSESSMENT_TEMPLATE(source.assessment_template_id));
            } else if (source.question_template_bank_id) {
                navigate(ROUTES.QUESTION_TEMPLATE_BANK(source.question_template_bank_id));
            } else {
                toast.error("Source template location not found");
            }
        } catch {
            toast.error("Failed to find source template");
        }
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
            navigate(`/assessments/${newAssessment.id}`);
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
        if (reorderMutation.isPending || !templateId) return;

        const session = validateSession();
        if (!session) return;

        const templateOrders = reorderedTemplates.map((t, index) => ({
            question_template_id: t.id,
            order: index + 1,
        }));

        reorderMutation.mutate(
            {
                templateId,
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

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!assessmentTemplate) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                Assessment template not found
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/folders/${assessmentTemplate.folder_id}`)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{assessmentTemplate.title}</h1>
                    {assessmentTemplate.description && (
                        <p className="text-muted-foreground mt-1">
                            {assessmentTemplate.description}
                        </p>
                    )}
                </div>
                {!isReorderMode ? (
                    <>
                        <Button variant="outline" onClick={() => setShowInstantiateDialog(true)}>
                            <Play className="h-4 w-4 mr-2" />
                            Instantiate Assessment
                        </Button>
                        {canEdit && (
                            <>
                                <Button variant="outline" onClick={() => setShowCollabModal(true)}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsReorderMode(true);
                                        setReorderedTemplates(sortedTemplates);
                                    }}
                                >
                                    <GripVertical className="h-4 w-4 mr-2" />
                                    Reorder
                                </Button>
                                <Button onClick={() => setShowAddTemplateModal(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Template
                                </Button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReorderMode(false);
                                setReorderedTemplates([]);
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

            {/* Question Templates List */}
            <QuestionTemplatesList
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
                onGoToSource={handleGoToTemplateSource}
                onUnlink={handleUnlinkTemplate}
                canEdit={canEdit}
            />

            {/* Add Question Template Modal */}
            {user && (
                <AddQuestionTemplateModal
                    open={showAddTemplateModal}
                    onOpenChange={setShowAddTemplateModal}
                    destination={{ type: "assessmentTemplate", id: templateId }}
                    ownerId={user.id}
                    onSelectExisting={handleSelectExisting}
                />
            )}

            {/* Create From Template Modal */}
            <CreateFromTemplateModal
                open={showCreateFromTemplate}
                onOpenChange={setShowCreateFromTemplate}
                template={selectedTemplate}
            />

            {/* Link or Duplicate Template Modal */}
            <LinkOrDuplicateTemplateModal
                open={showLinkOrDuplicateModal}
                onOpenChange={setShowLinkOrDuplicateModal}
                onLink={handleLinkTemplate}
                onDuplicate={handleDuplicateTemplate}
                isLoading={linkQuestionTemplate.isPending || addQuestionTemplate.isPending}
            />

            {/* Instantiate Assessment Modal */}
            <InstantiateAssessmentModal
                open={showInstantiateDialog}
                onOpenChange={setShowInstantiateDialog}
                assessmentTemplateTitle={assessmentTemplate.title}
                questionTemplates={assessmentTemplate.question_templates ?? []}
                onInstantiate={handleInstantiate}
                onCancelGeneration={generateAssessment.cancel}
                isLoading={generateAssessment.isPending}
            />

            {/* Remove Template Confirmation */}
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
                    resourceId={templateId}
                    isOpen={showCollabModal}
                    onOpenChange={setShowCollabModal}
                    myRole={myRole}
                    currentVisibility={assessmentTemplate.visibility}
                    onVisibilityChange={(visibility) =>
                        updateTemplate.mutate({
                            templateId,
                            data: { visibility },
                            oldFolderId: assessmentTemplate.folder_id,
                        })
                    }
                    isVisibilityUpdating={updateTemplate.isPending}
                    resourceDetailQueryKey={queryKeys.assessmentTemplates.detail(templateId)}
                />
            )}
        </div>
    );
}

export default AssessmentTemplatePage;
