import type { ReactNode } from "react";
import { EmptyCollectionState } from "@/shared/components/resource-collections/EmptyCollectionState";
import { ReorderableList } from "@/shared/components/dnd/ReorderableList";

interface ResourceListProps<TItem extends { id: string }> {
    items: TItem[];
    emptyTitle: string;
    emptyDescription: string;
    isReorderMode?: boolean;
    onReorder?: (items: TItem[]) => void;
    renderItem: (item: TItem, index: number) => ReactNode;
}

export function ResourceList<TItem extends { id: string }>({
    items,
    emptyTitle,
    emptyDescription,
    isReorderMode = false,
    onReorder,
    renderItem,
}: ResourceListProps<TItem>) {
    return (
        <ReorderableList
            items={items}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyState={<EmptyCollectionState title={emptyTitle} description={emptyDescription} />}
            renderItem={renderItem}
        />
    );
}
