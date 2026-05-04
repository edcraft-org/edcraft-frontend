import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    isReorderMode: boolean;
    disabled?: boolean;
}

export function SortableItem({ id, children, isReorderMode, disabled = false }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: !isReorderMode || disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3",
                isDragging && "opacity-50 scale-105 shadow-lg z-50",
            )}
        >
            {isReorderMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                >
                    <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </div>
            )}
            <div className="flex-1">{children}</div>
        </div>
    );
}
