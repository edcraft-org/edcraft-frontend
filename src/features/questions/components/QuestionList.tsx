import type { QuestionResponse } from "@/types/frontend.types";
import { ResourceList } from "@/shared/components";
import { QuestionCard } from "./QuestionCard";

interface QuestionListProps {
    questions: QuestionResponse[];
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
    onAddToCanvas: (question: QuestionResponse) => void;
    onSync: (question: QuestionResponse) => void;
    onUnlink: (question: QuestionResponse) => void;
    onGoToSource: (question: QuestionResponse) => void;
    isReorderMode?: boolean;
    onReorder?: (newOrder: QuestionResponse[]) => void;
    canEdit?: boolean;
}

export function QuestionList({
    questions,
    onEdit,
    onDuplicate,
    onRemove,
    onAddToCanvas,
    onSync,
    onUnlink,
    onGoToSource,
    isReorderMode = false,
    onReorder,
    canEdit = true,
}: QuestionListProps) {
    return (
        <ResourceList
            items={questions}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyTitle="No questions yet"
            emptyDescription="Add questions using the button above"
            renderItem={(question, index) => (
                <QuestionCard
                    question={question}
                    questionNumber={index + 1}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                    onAddToCanvas={onAddToCanvas}
                    onSync={onSync}
                    onUnlink={onUnlink}
                    onGoToSource={onGoToSource}
                    canEdit={canEdit}
                />
            )}
        />
    );
}
