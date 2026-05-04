import type { ReactNode } from "react";
import { EmptyResourceState } from "./EmptyResourceState";
import { ReorderableList } from "@/shared/components/dnd/ReorderableList";

interface ResourceItemListProps<TItem extends { id: string }> {
    items: TItem[];
    emptyTitle: string;
    emptyDescription: string;
    isReorderMode?: boolean;
    onReorder?: (items: TItem[]) => void;
    renderItem: (item: TItem, index: number) => ReactNode;
}

export function ResourceItemList<TItem extends { id: string }>({
    items,
    emptyTitle,
    emptyDescription,
    isReorderMode = false,
    onReorder,
    renderItem,
}: ResourceItemListProps<TItem>) {
    return (
        <ReorderableList
            items={items}
            isReorderMode={isReorderMode}
            onReorder={onReorder}
            emptyState={<EmptyResourceState title={emptyTitle} description={emptyDescription} />}
            renderItem={renderItem}
        />
    );
}
