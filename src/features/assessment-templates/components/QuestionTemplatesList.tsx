import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateCard } from "@/features/question-templates";

interface QuestionTemplatesListProps {
  templates: QuestionTemplateResponse[];
  onCreateQuestion: (template: QuestionTemplateResponse) => void;
  onEdit: (template: QuestionTemplateResponse) => void;
  onDuplicate: (template: QuestionTemplateResponse) => void;
  onRemove: (template: QuestionTemplateResponse) => void;
}

export function QuestionTemplatesList({
  templates,
  onCreateQuestion,
  onEdit,
  onDuplicate,
  onRemove,
}: QuestionTemplatesListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No question templates yet</p>
        <p className="text-sm">Add question templates using the button above</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template, index) => (
        <QuestionTemplateCard
          key={template.id}
          template={template}
          index={index}
          onCreateQuestion={onCreateQuestion}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
