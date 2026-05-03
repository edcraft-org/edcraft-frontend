// QuestionTemplateBankPage - View and manage question template bank templates

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { ResourcePath } from "@/api/models";
import {
    CollaborationModal,
    DeleteConfirmationDialog,
    EmptyResourceState,
    ResourcePageHeader,
} from "@/shared/components";
import { queryKeys } from "@/api";
import { ROUTES } from "@/router/paths";
import { getQuestionTemplate } from "@/features/question-templates/question-template.service";
import {
    useQuestionTemplateBank,
    useInsertQuestionTemplateIntoBank,
    useLinkQuestionTemplateToBank,
    useRemoveQuestionTemplateFromBank,
    useSyncQuestionTemplateInBank,
    useUnlinkQuestionTemplateInBank,
    useUpdateQuestionTemplateBank,
} from "./useQuestionTemplateBanks";
import {
    AddQuestionTemplateModal,
    CreateFromTemplateModal,
    LinkOrDuplicateTemplateModal,
    QuestionTemplateCard,
} from "@/features/question-templates";
import type { QuestionTemplateResponse, CreateQuestionTemplateRequest } from "@/api/models";
import { canEditResource, notifyMutationError } from "@/shared/utils/resourceUtils";
import { questionTemplateResponseToCreateRequest } from "@/shared/utils/questionTemplateUtils";

function QuestionTemplateBankPage() {
    const { templateBankId } = useParams<{ templateBankId: string }>();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplateResponse | null>(null);
    const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
    const [showCollabModal, setShowCollabModal] = useState(false);

    const { data: templateBank, isLoading } = useQuestionTemplateBank(templateBankId || "");

    const myRole = templateBank?.my_role ?? null;
    const canEdit = canEditResource(myRole);

    const insertTemplate = useInsertQuestionTemplateIntoBank();
    const linkTemplate = useLinkQuestionTemplateToBank();
    const removeTemplate = useRemoveQuestionTemplateFromBank();
    const syncTemplate = useSyncQuestionTemplateInBank();
    const unlinkTemplate = useUnlinkQuestionTemplateInBank();
    const updateTemplateBank = useUpdateQuestionTemplateBank();

    const sortedTemplates = useMemo(
        () =>
            [...(templateBank?.question_templates ?? [])].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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
        toast.error(notifyMutationError(error, operationName));
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

    const handleDuplicateTemplate = (templateParam?: QuestionTemplateResponse) => {
        if (insertTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        const template = templateParam || validateTemplateSelected(selectedTemplate);
        if (!template) return;

        handleInsertTemplateMutation(
            session.templateBankId,
            questionTemplateResponseToCreateRequest(template),
            "Template duplicated successfully",
            () => {
                setShowLinkOrDuplicateModal(false);
                setSelectedTemplate(null);
            },
        );
    };

    const handleSyncTemplate = (template: QuestionTemplateResponse) => {
        if (syncTemplate.isPending) return;
        const session = validateSession();
        if (!session) return;
        syncTemplate.mutate(
            { templateBankId: session.templateBankId, questionTemplateId: template.id },
            {
                onSuccess: () => toast.success("Question template synced from source"),
                onError: (error) => handleMutationError(error, "sync template"),
            },
        );
    };

    const handleUnlinkTemplate = (template: QuestionTemplateResponse) => {
        if (unlinkTemplate.isPending) return;
        const session = validateSession();
        if (!session) return;
        unlinkTemplate.mutate(
            { templateBankId: session.templateBankId, questionTemplateId: template.id },
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
            <ResourcePageHeader
                title={templateBank.title}
                description={templateBank.description}
                onBack={() => navigate(ROUTES.FOLDER(templateBank.folder_id))}
                actions={
                    canEdit ? (
                        <>
                            <Button variant="outline" onClick={() => setShowCollabModal(true)}>
                                <Users className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Template
                            </Button>
                        </>
                    ) : undefined
                }
            />

            <div className="space-y-4">
                {sortedTemplates.length === 0 ? (
                    <EmptyResourceState
                        title="No templates yet"
                        description="Add templates using the button above"
                    />
                ) : (
                    sortedTemplates.map((template, index) => (
                        <QuestionTemplateCard
                            key={template.id}
                            template={template}
                            index={index}
                            onCreateQuestion={handleCreateQuestion}
                            onEdit={handleEditTemplate}
                            onDuplicate={handleDuplicateTemplate}
                            onRemove={(template) => {
                                setSelectedTemplate(template);
                                setShowRemoveDialog(true);
                            }}
                            onSync={handleSyncTemplate}
                            onGoToSource={handleGoToTemplateSource}
                            onUnlink={handleUnlinkTemplate}
                            canEdit={canEdit}
                        />
                    ))
                )}
            </div>

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
                canEdit={canEdit}
            />

            <LinkOrDuplicateTemplateModal
                open={showLinkOrDuplicateModal}
                onOpenChange={setShowLinkOrDuplicateModal}
                onLink={handleLinkTemplate}
                onDuplicate={handleDuplicateTemplate}
                isLoading={linkTemplate.isPending || insertTemplate.isPending}
            />

            <DeleteConfirmationDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                onConfirm={handleRemoveTemplate}
                isLoading={removeTemplate.isPending}
                resourceName="question template"
            />

            {myRole && (
                <CollaborationModal
                    resourcePath={ResourcePath["question-template-banks"]}
                    resourceId={templateBankId}
                    isOpen={showCollabModal}
                    onOpenChange={setShowCollabModal}
                    myRole={myRole}
                    currentVisibility={templateBank.visibility}
                    onVisibilityChange={(visibility) =>
                        updateTemplateBank.mutate({
                            templateBankId,
                            data: { visibility },
                            oldFolderId: templateBank.folder_id,
                        })
                    }
                    isVisibilityUpdating={updateTemplateBank.isPending}
                    resourceDetailQueryKey={queryKeys.questionTemplateBanks.detail(templateBankId)}
                />
            )}
        </div>
    );
}

export default QuestionTemplateBankPage;
