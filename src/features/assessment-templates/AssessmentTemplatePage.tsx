// AssessmentTemplatePage - View and manage assessment template with question templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
    AddQuestionTemplateModal,
    LinkOrDuplicateTemplateModal,
    type QuestionTemplateConfig,
} from "@/features/question-templates";
import { QuestionTemplatesList, RemoveTemplateDialog } from "./components";
import {
    useAddQuestionTemplateToAssessmentTemplate,
    useLinkQuestionTemplateToAssessmentTemplate,
    useRemoveQuestionTemplateFromAssessmentTemplate,
    useAssessmentTemplate,
} from "./useAssessmentTemplates";
import type { QuestionTemplateResponse } from "@/api/models";

function AssessmentTemplatePage() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplateResponse | null>(null);

    if (!templateId) {
        return <div className="p-6 text-center text-muted-foreground">Template ID is missing</div>;
    }

    const { data: assessmentTemplate, isLoading } = useAssessmentTemplate(templateId);

    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
    const linkQuestionTemplate = useLinkQuestionTemplateToAssessmentTemplate();
    const removeQuestionTemplate = useRemoveQuestionTemplateFromAssessmentTemplate();

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
        userId: string,
        templateData: {
            question_type: QuestionTemplateResponse["question_type"];
            question_text: QuestionTemplateResponse["question_text"];
            description?: string | undefined;
            template_config: QuestionTemplateConfig;
        },
        successMessage: string,
        onSuccess: () => void,
    ) => {
        addQuestionTemplate.mutate(
            {
                templateId,
                data: {
                    question_template: {
                        owner_id: userId,
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
        toast.info("Question creation from template will be available soon");
    };

    const handleEditTemplate = (template: QuestionTemplateResponse) => {
        setSelectedTemplate(template);
        toast.info("Question template editor will be available soon");
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

        handleAddQuestionTemplateMutation(
            session.templateId,
            session.userId,
            {
                question_type: template.question_type,
                question_text: template.question_text,
                description: template.description ?? undefined,
                template_config: template.template_config as unknown as QuestionTemplateConfig,
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

    const sortedTemplates = useMemo(
        () => [...(assessmentTemplate.question_templates ?? [])].sort((a, b) => a.order - b.order),
        [assessmentTemplate.question_templates],
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

                <Button onClick={() => setShowAddTemplateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                </Button>
            </div>

            {/* Question Templates List */}
            <QuestionTemplatesList
                templates={sortedTemplates}
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
            />

            {/* Add Question Template Modal */}
            {user && templateId && (
                <AddQuestionTemplateModal
                    open={showAddTemplateModal}
                    onOpenChange={setShowAddTemplateModal}
                    assessmentTemplateId={templateId}
                    ownerId={user.id}
                    onSelectExisting={handleSelectExisting}
                />
            )}

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
