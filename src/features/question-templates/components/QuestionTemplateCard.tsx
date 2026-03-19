import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateContent } from "@/components/QuestionTemplateContent";
import { QuestionTemplateActionsMenu } from "./QuestionTemplateActionsMenu";

interface QuestionTemplateCardProps {
    template: QuestionTemplateResponse;
    index: number;
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
    onSync: (template: QuestionTemplateResponse) => void;
    onGoToSource: (template: QuestionTemplateResponse) => void;
    onUnlink: (template: QuestionTemplateResponse) => void;
}

export function QuestionTemplateCard({
    template,
    index,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
    onSync,
    onGoToSource,
    onUnlink,
}: QuestionTemplateCardProps) {
    return (
        <QuestionTemplateContent
            template={template}
            index={index}
            actions={
                <QuestionTemplateActionsMenu
                    template={template}
                    onCreateQuestion={onCreateQuestion}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                />
            }
            onSync={onSync}
            onGoToSource={onGoToSource}
            onUnlink={onUnlink}
        />
    );
}
