// SaveTemplateModal - Modal for saving question templates to assessment templates or question template banks

import { FileText, Database } from "lucide-react";
import { useAssessmentTemplates } from "@/features/assessment-templates/hooks/useAssessmentTemplates";
import { useQuestionTemplateBanks } from "@/features/question-template-banks/hooks/useQuestionTemplateBanks";
import { useFolders } from "@/features/folders/hooks/useFolders";
import { SaveResourceModal } from "@/shared/components/resource/SaveResourceModal";
import { ResourceBrowser } from "@/shared/components/resource/ResourceBrowser";

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;

    // Assessment template callbacks
    onSaveToNewAssessmentTemplate: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingAssessmentTemplate: (assessmentTemplateId: string) => void;

    // Question template bank callbacks
    onSaveToNewQuestionTemplateBank: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingQuestionTemplateBank: (questionTemplateBankId: string) => void;

    // Loading states
    isLoadingAssessmentTemplate?: boolean;
    isLoadingQuestionTemplateBank?: boolean;

    // Pre-selection
    preSelectedAssessmentTemplateId?: string;
    preSelectedQuestionTemplateBankId?: string;

    // Optional: Skip destination choice
    initialView?: "destination" | "assessment-template" | "question-template-bank";
}
export function SaveTemplateModal(props: SaveTemplateModalProps) {
    const {
        open,
        onOpenChange,
        ownerId,
        currentFolderId,
        onSaveToNewAssessmentTemplate,
        onSaveToExistingAssessmentTemplate,
        onSaveToNewQuestionTemplateBank,
        onSaveToExistingQuestionTemplateBank,
        initialView,
    } = props;

    const { data: assessmentTemplates } = useAssessmentTemplates(ownerId);
    const { data: questionTemplateBanks } = useQuestionTemplateBanks(ownerId);
    const { data: folders } = useFolders({});

    return (
        <SaveResourceModal
            open={open}
            onOpenChange={onOpenChange}
            title="Save Question Template"
            description="Choose where to save this template"
            folders={folders}
            currentFolderId={currentFolderId}
            initialResourceKey={initialView === "destination" ? undefined : initialView}
            resources={[
                {
                    key: "assessment-template",
                    label: "Assessment Template",
                    description: "Save to assessment template",
                    icon: FileText,
                    createTitle: "Create Assessment Template",
                    createDescription: "Start a template",
                    formConfig: {
                        titlePlaceholder: "e.g., Exam Template",
                        descriptionPlaceholder: "Describe template...",
                    },
                    data: assessmentTemplates,
                    Browser: (props) => (
                        <ResourceBrowser
                            {...props}
                            icon={FileText}
                            searchPlaceholder="Search assessment templates..."
                            emptyMessage="No assessment templates yet. Create one above."
                            emptySearchMessage="No assessment templates match your search"
                        />
                    ),
                    onSelect: onSaveToExistingAssessmentTemplate,
                    onCreate: ({ title, description, folderId }) =>
                        onSaveToNewAssessmentTemplate(title, description, folderId),
                },
                {
                    key: "question-template-bank",
                    label: "Question Template Bank",
                    description: "Reusable templates",
                    icon: Database,
                    createTitle: "Create Template Bank",
                    createDescription: "Start a template bank",
                    formConfig: {
                        titlePlaceholder: "e.g., MCQ Templates",
                        descriptionPlaceholder: "Describe...",
                    },
                    data: questionTemplateBanks,
                    Browser: (props) => (
                        <ResourceBrowser
                            {...props}
                            icon={Database}
                            searchPlaceholder="Search question template banks..."
                            emptyMessage="No question template banks yet."
                            emptySearchMessage="No question template banks match your search"
                        />
                    ),
                    onSelect: onSaveToExistingQuestionTemplateBank,
                    onCreate: ({ title, description, folderId }) =>
                        onSaveToNewQuestionTemplateBank(title, description, folderId),
                },
            ]}
        />
    );
}
