import { useUserStore } from "@/shared/stores/user.store";
import { TreeSkeleton } from "@/shared/components/LoadingSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderTree } from "@/features/folders/components/FolderTree";

export function Sidebar() {
    const { rootFolderId, hasHydrated } = useUserStore();

    if (!hasHydrated) {
        return <SidebarSkeleton />;
    }

    if (!rootFolderId) {
        return (
            <aside className="w-64 border-r bg-muted/30">
                <div className="p-4">
                    <h2 className="text-sm font-medium text-muted-foreground mb-4">Folders</h2>
                    <div className="text-sm text-muted-foreground">
                        Sign in to view folders
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-sm font-medium">Folders</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    <FolderTree />
                </div>
            </ScrollArea>
        </aside>
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
