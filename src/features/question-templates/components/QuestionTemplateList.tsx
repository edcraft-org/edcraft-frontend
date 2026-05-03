import type { QuestionTemplateResponse } from "@/api/models";
import { ResourceItemList } from "@/shared/components";
import { QuestionTemplateCard } from "./QuestionTemplateCard";

interface QuestionTemplateListProps {
    templates: QuestionTemplateResponse[];
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
    onSync: (template: QuestionTemplateResponse) => void;
    onGoToSource: (template: QuestionTemplateResponse) => void;
    onUnlink: (template: QuestionTemplateResponse) => void;
    isReorderMode?: boolean;
    onReorder?: (newOrder: QuestionTemplateResponse[]) => void;
    canEdit: boolean;
}

export function QuestionTemplateList({
    templates,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
    onSync,
    onGoToSource,
    onUnlink,
    isReorderMode = false,
    onReorder,
    canEdit,
}: QuestionTemplateListProps) {
    return (
        <ResourceItemList
            items={templates}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyTitle="No question templates yet"
            emptyDescription="Add question templates using the button above"
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
