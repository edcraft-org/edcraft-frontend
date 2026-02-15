// QuestionTemplateBankPage - View and manage question template bank templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { ROUTES } from "@/router/paths";
import {
    useQuestionTemplateBank,
    useInsertQuestionTemplateIntoBank,
    useLinkQuestionTemplateToBank,
    useRemoveQuestionTemplateFromBank,
} from "./useQuestionTemplateBanks";
import {
    QuestionTemplatesList,
    RemoveTemplateDialog,
} from "@/features/assessment-templates/components";
import {
    AddQuestionTemplateModal,
    LinkOrDuplicateTemplateModal,
} from "@/features/question-templates";
import type { QuestionTemplateResponse, CreateQuestionTemplateRequest } from "@/api/models";
import { CreateFromTemplateModal } from "@/features/question-templates/components";

function QuestionTemplateBankPage() {
    const { templateBankId } = useParams<{ templateBankId: string }>();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplateResponse | null>(null);
    const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);

    const { data: templateBank, isLoading } = useQuestionTemplateBank(templateBankId || "");

    const insertTemplate = useInsertQuestionTemplateIntoBank();
    const linkTemplate = useLinkQuestionTemplateToBank();
    const removeTemplate = useRemoveQuestionTemplateFromBank();

    const sortedTemplates = useMemo(
        () =>
            [...(templateBank?.question_templates ?? [])].sort(
                (a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime(),
            ),
        [templateBank?.question_templates],
    );

    if (!templateBankId) {
        return (
            <div className="p-6 text-center text-muted-foreground">Template bank ID is missing</div>
        );
    }

    // Validation Helpers
    const validateSession = (): { templateBankId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        return { templateBankId, userId: user.id };
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

    // Inserts a new template to the template bank (used when duplicating)
    const handleInsertTemplateMutation = (
        templateBankId: string,
        templateData: CreateQuestionTemplateRequest,
        successMessage: string,
        onSuccess: () => void,
    ) => {
        insertTemplate.mutate(
            {
                templateBankId,
                data: {
                    question_template: templateData,
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

    // Links an existing template to the template bank
    const handleLinkTemplateMutation = (
        templateBankId: string,
        questionTemplateId: string,
        onSuccess: () => void,
    ) => {
        linkTemplate.mutate(
            {
                templateBankId,
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

    // Removes a template from the template bank
    const handleRemoveTemplateMutation = (
        templateBankId: string,
        questionTemplateId: string,
        onSuccess: () => void,
    ) => {
        removeTemplate.mutate(
            {
                templateBankId,
                questionTemplateId,
            },
            {
                onSuccess: () => {
                    toast.success("Question template removed from bank");
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
        if (linkTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleLinkTemplateMutation(session.templateBankId, template.id, () => {
            setShowLinkOrDuplicateModal(false);
            setSelectedTemplate(null);
        });
    };

    const handleDuplicateTemplate = () => {
        if (insertTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
        if (!template) return;

        // Create a new template with the same data
        const templateData: CreateQuestionTemplateRequest = {
            question_type: template.question_type,
            question_text: template.question_text,
            description: template.description,
            code: template.code,
            entry_function: template.entry_function,
            num_distractors: template.num_distractors,
            output_type: template.output_type,
            target_elements: template.target_elements,
        };

        handleInsertTemplateMutation(
            session.templateBankId,
            templateData,
            "Template duplicated successfully",
            () => {
                setShowLinkOrDuplicateModal(false);
                setSelectedTemplate(null);
            },
        );
    };

    const handleRemoveTemplate = () => {
        if (removeTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleRemoveTemplateMutation(session.templateBankId, template.id, () => {
            setShowRemoveDialog(false);
            setSelectedTemplate(null);
        });
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!templateBank) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                Question template bank not found
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
                    onClick={() => navigate(`/folders/${templateBank.folder_id}`)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{templateBank.title}</h1>
                    {templateBank.description && (
                        <p className="text-muted-foreground mt-1">{templateBank.description}</p>
                    )}
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                </Button>
            </div>

            <QuestionTemplatesList
                templates={sortedTemplates}
                onCreateQuestion={handleCreateQuestion}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicateTemplate}
                onRemove={(template) => {
                    setSelectedTemplate(template);
                    setShowRemoveDialog(true);
                }}
            />

            {user && (
                <AddQuestionTemplateModal
                    open={showAddModal}
                    onOpenChange={setShowAddModal}
                    destination={{ type: "templateBank", id: templateBankId }}
                    ownerId={user.id}
                    onSelectExisting={handleSelectExisting}
                />
            )}

            <CreateFromTemplateModal
                open={showCreateFromTemplate}
                onOpenChange={setShowCreateFromTemplate}
                template={selectedTemplate}
            />

            {user && (
                <LinkOrDuplicateTemplateModal
                    open={showLinkOrDuplicateModal}
                    onOpenChange={setShowLinkOrDuplicateModal}
                    template={selectedTemplate}
                    ownerId={user.id}
                    onLink={handleLinkTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    isLoading={linkTemplate.isPending || insertTemplate.isPending}
                />
            )}

            <RemoveTemplateDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                onConfirm={handleRemoveTemplate}
                isLoading={removeTemplate.isPending}
            />
        </div>
    );
}

export default QuestionTemplateBankPage;
