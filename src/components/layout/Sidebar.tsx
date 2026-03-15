import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { TreeSkeleton } from "@/shared/components/LoadingSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderTree } from "@/features/folders/components/FolderTree";
import { Button } from "@/components/ui/button";

export function Sidebar() {
    const { rootFolderId, hasHydrated } = useUserStore();
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        if (hasHydrated) {
            setIsCollapsed(!rootFolderId);
        }
    }, [hasHydrated, rootFolderId]);

    if (!hasHydrated) {
        return <SidebarSkeleton />;
    }

    if (!rootFolderId) {
        return (
            <aside className={`border-r bg-muted/30 transition-all duration-300 ${isCollapsed ? "w-10" : "w-64"}`}>
                {!isCollapsed && (
                    <div className="p-4">
                        <h2 className="text-sm font-medium text-muted-foreground mb-4">Folders</h2>
                        <div className="text-sm text-muted-foreground">
                            Sign in to view folders
                        </div>
                    </div>
                )}
                <CollapseToggle isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)} />
            </aside>
        );
    }

    return (
        <aside className={`border-r bg-muted/30 flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? "w-10" : "w-64"}`}>
            <div className="p-2 border-b flex items-center justify-between min-h-[49px]">
                {!isCollapsed && <h2 className="text-sm font-medium px-2">Folders</h2>}
                <CollapseToggle isCollapsed={isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)} />
            </div>
            {!isCollapsed && (
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        <FolderTree />
                    </div>
                </ScrollArea>
            )}
        </aside>
    );
}

function CollapseToggle({ isCollapsed, onClick }: { isCollapsed: boolean; onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClick}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
    );
}

export function SidebarSkeleton() {
    return (
        <aside className="w-64 border-r bg-muted/30">
            <div className="p-4 border-b">
                <h2 className="text-sm font-medium">Folders</h2>
            </div>
            <TreeSkeleton />
        </aside>
    );
}
