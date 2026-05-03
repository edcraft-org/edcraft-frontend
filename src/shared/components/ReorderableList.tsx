import type { ReactNode } from "react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/shared/components/SortableItem";

interface ReorderableListProps<TItem extends { id: string }> {
    items: TItem[];
    isReorderMode?: boolean;
    emptyState: ReactNode;
    onReorder?: (items: TItem[]) => void;
    renderItem: (item: TItem, index: number) => ReactNode;
}

export function ReorderableList<TItem extends { id: string }>({
    items,
    isReorderMode = false,
    emptyState,
    onReorder,
    renderItem,
}: ReorderableListProps<TItem>) {
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

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        onReorder?.(arrayMove(items, oldIndex, newIndex));
    };

    if (items.length === 0) {
        return emptyState;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <SortableItem key={item.id} id={item.id} isReorderMode={isReorderMode}>
                            {renderItem(item, index)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
