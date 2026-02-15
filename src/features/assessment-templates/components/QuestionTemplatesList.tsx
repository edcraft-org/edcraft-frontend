import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateCard } from "@/features/question-templates";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/shared/components/SortableItem";

interface QuestionTemplatesListProps {
    templates: QuestionTemplateResponse[];
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
    isReorderMode?: boolean;
    onReorder?: (newOrder: QuestionTemplateResponse[]) => void;
}

export function QuestionTemplatesList({
    templates,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
    isReorderMode = false,
    onReorder,
}: QuestionTemplatesListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = templates.findIndex((t) => t.id === active.id);
        const newIndex = templates.findIndex((t) => t.id === over.id);

        const reordered = arrayMove(templates, oldIndex, newIndex);
        onReorder?.(reordered);
    };

    if (templates.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No question templates yet</p>
                <p className="text-sm">Add question templates using the button above</p>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={templates.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                    {templates.map((template, index) => (
                        <SortableItem
                            key={template.id}
                            id={template.id}
                            isReorderMode={isReorderMode}
                        >
                            <QuestionTemplateCard
                                template={template}
                                index={index}
                                onCreateQuestion={onCreateQuestion}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onRemove={onRemove}
                            />
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
