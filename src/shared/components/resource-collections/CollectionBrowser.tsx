import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export interface CollectionBrowserItem {
    id: string;
    title: string;
    description?: string | null;
}

interface CollectionBrowserProps<T extends CollectionBrowserItem> {
    data: T[];
    isLoading?: boolean;
    onSelect: (id: string) => void;
    disabled?: boolean;
    preSelectedId?: string;

    searchPlaceholder?: string;
    emptyMessage?: string;
    emptySearchMessage?: string;

    icon: React.ComponentType<{ className?: string }>;
}

export function CollectionBrowser<T extends CollectionBrowserItem>({
    data,
    isLoading,
    onSelect,
    disabled,
    preSelectedId,
    searchPlaceholder = "Search...",
    emptyMessage = "No items yet. Create one above.",
    emptySearchMessage = "No results found.",
    icon: Icon,
}: CollectionBrowserProps<T>) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return data?.filter((item) =>
            item.title.toLowerCase().includes(q)
        ) ?? [];
    }, [data, query]);

    return (
        <div className="space-y-3">
            <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
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
                                className={`cursor-pointer hover:bg-muted/50 ${
                                    preSelectedId === item.id ? "border-primary" : ""
                                }`}
                                onClick={() => !disabled && onSelect(item.id)}
                            >
                                <CardContent className="p-3 flex gap-3">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {item.title}
                                        </p>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.description}
                                            </p>
                                        )}
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
