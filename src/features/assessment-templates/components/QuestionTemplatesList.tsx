import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateCard } from "@/features/question-templates";
import { EmptyResourceState, ReorderableList } from "@/shared/components";

interface QuestionTemplatesListProps {
    templates: QuestionTemplateResponse[];
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
    isReorderMode?: boolean;
    onReorder?: (newOrder: QuestionTemplateResponse[]) => void;
    onSync: (template: QuestionTemplateResponse) => void;
    onGoToSource: (template: QuestionTemplateResponse) => void;
    onUnlink: (template: QuestionTemplateResponse) => void;
    canEdit: boolean;
}

export function QuestionTemplatesList({
    templates,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
    isReorderMode = false,
    onReorder,
    onSync,
    onGoToSource,
    onUnlink,
    canEdit,
}: QuestionTemplatesListProps) {
    return (
        <ReorderableList
            items={templates}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyState={
                <EmptyResourceState
                    title="No question templates yet"
                    description="Add question templates using the button above"
                />
            }
            renderItem={(template, index) => (
                <QuestionTemplateCard
                    template={template}
                    index={index}
                    onCreateQuestion={onCreateQuestion}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                    onSync={onSync}
                    onGoToSource={onGoToSource}
                    onUnlink={onUnlink}
                    canEdit={canEdit}
                />
            )}
        />
    );
}
