import type { QuestionResponse } from "@/types/frontend.types";
import { QuestionCard } from "@/features/questions";
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

interface QuestionsListProps {
    questions: QuestionResponse[];
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
    isReorderMode?: boolean;
    onReorder?: (newOrder: QuestionResponse[]) => void;
    isOwner?: boolean;
}

export function QuestionsList({
    questions,
    onEdit,
    onDuplicate,
    onRemove,
    isReorderMode = false,
    onReorder,
    isOwner = true,
}: QuestionsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);

        const reordered = arrayMove(questions, oldIndex, newIndex);
        onReorder?.(reordered);
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No questions yet</p>
                <p className="text-sm">Add questions using the button above</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <SortableItem
                            key={question.id}
                            id={question.id}
                            isReorderMode={isReorderMode}
                        >
                            <QuestionCard
                                question={question}
                                questionNumber={index + 1}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onRemove={onRemove}
                                showActions={isOwner}
                            />
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
