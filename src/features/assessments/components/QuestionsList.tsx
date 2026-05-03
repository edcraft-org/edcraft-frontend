import type { QuestionResponse } from "@/types/frontend.types";
import { QuestionCard } from "@/features/questions";
import { EmptyResourceState, ReorderableList } from "@/shared/components";

interface QuestionsListProps {
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

export function QuestionsList({
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
}: QuestionsListProps) {
    return (
        <ReorderableList
            items={questions}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyState={
                <EmptyResourceState
                    title="No questions yet"
                    description="Add questions using the button above"
                />
            }
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
