// SaveQuestionModal - Modal for saving questions to assessments or question banks

import { FileText, Database } from "lucide-react";
import { useAssessments } from "@/features/assessments/hooks/useAssessments";
import { useQuestionBanks } from "@/features/question-banks/hooks/useQuestionBanks";
import { useFolders } from "@/features/folders/hooks/useFolders";
import { SaveResourceModal } from "@/shared/components/resource/SaveResourceModal";
import { ResourceBrowser } from "@/shared/components/resource/ResourceBrowser";

interface SaveQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    currentFolderId: string;

    // Assessment callbacks
    onSaveToNewAssessment: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingAssessment: (assessmentId: string) => void;

    // Question bank callbacks
    onSaveToNewQuestionBank: (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => void;
    onSaveToExistingQuestionBank: (questionBankId: string) => void;

    // Loading states
    isLoadingAssessment?: boolean;
    isLoadingQuestionBank?: boolean;

    // Pre-selection
    preSelectedAssessmentId?: string;
    preSelectedQuestionBankId?: string;

    // Optional: Skip destination choice
    initialView?: "destination" | "assessment" | "question-bank";
}

export function SaveQuestionModal(props: SaveQuestionModalProps) {
    const {
        open,
        onOpenChange,
        ownerId,
        currentFolderId,
        onSaveToNewAssessment,
        onSaveToExistingAssessment,
        onSaveToNewQuestionBank,
        onSaveToExistingQuestionBank,
        isLoadingAssessment,
        isLoadingQuestionBank,
        preSelectedAssessmentId,
        preSelectedQuestionBankId,
        initialView,
    } = props;

    const { data: assessments } = useAssessments(ownerId);
    const { data: questionBanks } = useQuestionBanks(ownerId);
    const { data: folders } = useFolders({});

    return (
        <SaveResourceModal
            open={open}
            onOpenChange={onOpenChange}
            title="Save Question"
            description="Choose where to save this question"
            folders={folders}
            currentFolderId={currentFolderId}
            initialResourceKey={initialView === "destination" ? undefined : initialView}
            resources={[
                {
                    key: "assessment",
                    label: "Save to Assessment",
                    description: "Add to a quiz, test, or exam",
                    icon: FileText,
                    createTitle: "Create New Assessment",
                    createDescription: "Start a new assessment",
                    formConfig: {
                        titlePlaceholder: "e.g., Week 1 Quiz",
                        descriptionPlaceholder: "Describe this assessment...",
                    },
                    data: assessments,
                    isLoading: isLoadingAssessment,
                    preSelectedId: preSelectedAssessmentId,
                    Browser: (props) => (
                        <ResourceBrowser
                            {...props}
                            icon={FileText}
                            searchPlaceholder="Search assessments..."
                            emptyMessage="No assessments yet. Create one above."
                            emptySearchMessage="No assessments match your search"
                        />
                    ),
                    onSelect: onSaveToExistingAssessment,
                    onCreate: ({ title, description, folderId }) =>
                        onSaveToNewAssessment(title, description, folderId),
                },
                {
                    key: "question-bank",
                    label: "Save to Question Bank",
                    description: "Reusable question library",
                    icon: Database,
                    createTitle: "Create Question Bank",
                    createDescription: "Start a new question bank",
                    formConfig: {
                        titlePlaceholder: "e.g., Algebra Bank",
                        descriptionPlaceholder: "Add a description...",
                    },
                    data: questionBanks,
                    isLoading: isLoadingQuestionBank,
                    preSelectedId: preSelectedQuestionBankId,
                    Browser: (props) => (
                        <ResourceBrowser
                            {...props}
                            icon={Database}
                            searchPlaceholder="Search question banks..."
                            emptyMessage="No question banks yet. Create one above."
                            emptySearchMessage="No question banks match your search"
                        />
                    ),
                    onSelect: onSaveToExistingQuestionBank,
                    onCreate: ({ title, description, folderId }) =>
                        onSaveToNewQuestionBank(title, description, folderId),
                },
            ]}
        />
    );
}
