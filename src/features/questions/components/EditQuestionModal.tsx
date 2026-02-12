// EditQuestionModal - Modal for editing an existing question

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { QuestionEditor } from "./QuestionEditor";
import type { QuestionResponse, QuestionEditorData } from "@/types/frontend.types";

interface EditQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question: QuestionResponse | null;
    onSave: (data: QuestionEditorData) => void;
    isLoading?: boolean;
}

export function EditQuestionModal({
    open,
    onOpenChange,
    question,
    onSave,
    isLoading,
}: EditQuestionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                    <DialogDescription>Make changes to the question.</DialogDescription>
                </DialogHeader>
                {question && (
                    <QuestionEditor
                        question={question}
                        onSave={onSave}
                        onCancel={() => onOpenChange(false)}
                        isLoading={isLoading}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
