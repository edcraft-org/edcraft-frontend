import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface SelectableItem {
    id: string;
}

interface Props<T extends SelectableItem> {
    data?: T[];
    isLoading?: boolean;

    getTitle: (item: T) => string;
    getSubtitle?: (item: T) => string | null;
    getBadge?: (item: T) => string | null;

    onSelect: (item: T) => void;

    isFetchingItem?: (id: string) => boolean;

    searchPlaceholder?: string;
    emptyMessage?: string;
    emptySearchMessage?: string;
}

export function SelectableItemBrowser<T extends SelectableItem>({
    data,
    isLoading,
    getTitle,
    getSubtitle,
    getBadge,
    onSelect,
    isFetchingItem,
    searchPlaceholder = "Search...",
    emptyMessage = "No items yet.",
    emptySearchMessage = "No results found.",
}: Props<T>) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return (
            data?.filter((item) => {
                return (
                    getTitle(item).toLowerCase().includes(q) ||
                    getSubtitle?.(item)?.toLowerCase().includes(q)
                );
            }) ?? []
        );
    }, [data, query, getTitle, getSubtitle]);

    return (
        <div className="space-y-3">
            <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <ScrollArea className="h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {query ? emptySearchMessage : emptyMessage}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((item) => (
                            <Card
                                key={item.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onSelect(item)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex justify-between gap-2">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm line-clamp-2">{getTitle(item)}</p>
                                            {getSubtitle?.(item) && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {getSubtitle(item)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isFetchingItem?.(item.id) && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            {getBadge?.(item) && (
                                                <span className="text-xs px-2 py-1 bg-muted rounded">
                                                    {getBadge(item)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
