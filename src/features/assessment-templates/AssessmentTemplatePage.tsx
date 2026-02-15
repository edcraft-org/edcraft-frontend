// AssessmentTemplatePage - View and manage assessment template with question templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/router";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus, GripVertical } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
    AddQuestionTemplateModal,
    LinkOrDuplicateTemplateModal,
} from "@/features/question-templates";
import type { CreateTargetElementRequest } from "@/api/models";
import {
    InstantiateAssessmentModal,
    QuestionTemplatesList,
    RemoveTemplateDialog,
} from "./components";
import {
    useAddQuestionTemplateToAssessmentTemplate,
    useLinkQuestionTemplateToAssessmentTemplate,
    useRemoveQuestionTemplateFromAssessmentTemplate,
    useAssessmentTemplate,
    useGenerateAssessmentFromTemplate,
    useReorderQuestionTemplatesInAssessmentTemplate,
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

    const { data: assessmentTemplate, isLoading } = useAssessmentTemplate(templateId || "");

    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
    const linkQuestionTemplate = useLinkQuestionTemplateToAssessmentTemplate();
    const removeQuestionTemplate = useRemoveQuestionTemplateFromAssessmentTemplate();
    const generateAssessment = useGenerateAssessmentFromTemplate();
    const reorderMutation = useReorderQuestionTemplatesInAssessmentTemplate();

    const sortedTemplates = useMemo(
        () => [...(assessmentTemplate?.question_templates ?? [])].sort((a, b) => a.order - b.order),
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
            question_text: string;
            description?: string | undefined;
            code: string;
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
        navigate(
            `${ROUTES.TEMPLATE_BUILDER}?templateId=${template.id}`,
        );
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

    const handleDuplicateTemplate = () => {
        if (addQuestionTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
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
                question_text: template.question_text,
                description: template.description ?? undefined,
                code: template.code,
                entry_function: template.entry_function,
                output_type: template.output_type,
                num_distractors: template.num_distractors,
                target_elements: targetElements,
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

    const handleInstantiate = async (
        title: string,
        description: string | undefined,
        questionInputs: Array<Record<string, unknown>>,
    ) => {
        if (!user || !assessmentTemplate) return;

        generateAssessment.mutate(
            {
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
            },
            {
                onSuccess: (newAssessment) => {
                    toast.success("Assessment created successfully");
                    setShowInstantiateDialog(false);
                    navigate(`/assessments/${newAssessment.id}`);
                },
                onError: (error) => {
                    toast.error(`Failed to create assessment: ${error.message}`);
                },
            },
        );
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
                onDuplicate={(template) => {
                    setSelectedTemplate(template);
                    setShowLinkOrDuplicateModal(true);
                }}
                onRemove={(template) => {
                    setSelectedTemplate(template);
                    setShowRemoveDialog(true);
                }}
                isReorderMode={isReorderMode}
                onReorder={handleReorder}
            />

            {/* Add Question Template Modal */}
            {user && templateId && (
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
            {user && (
                <LinkOrDuplicateTemplateModal
                    open={showLinkOrDuplicateModal}
                    onOpenChange={setShowLinkOrDuplicateModal}
                    template={selectedTemplate}
                    ownerId={user.id}
                    onLink={handleLinkTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    isLoading={linkQuestionTemplate.isPending || addQuestionTemplate.isPending}
                />
            )}

            {/* Instantiate Assessment Modal */}
            <InstantiateAssessmentModal
                open={showInstantiateDialog}
                onOpenChange={setShowInstantiateDialog}
                assessmentTemplateTitle={assessmentTemplate.title}
                questionTemplates={assessmentTemplate.question_templates ?? []}
                onInstantiate={handleInstantiate}
                isLoading={generateAssessment.isPending}
            />

            {/* Remove Template Confirmation */}
            <RemoveTemplateDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                onConfirm={handleRemoveTemplate}
                isLoading={removeQuestionTemplate.isPending}
            />
        </div>
    );
}

export default AssessmentTemplatePage;
