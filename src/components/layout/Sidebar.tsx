import { useState, useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Share2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { TreeSkeleton } from "@/shared/components/feedback/LoadingSkeleton";
import { FolderTree } from "@/features/folders/components/FolderTree";
import { Button } from "@/components/ui/button";
import { SharedResourcesList } from "./SharedResourcesList";

export function Sidebar() {
    const { rootFolderId, hasHydrated } = useUserStore();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [isSharedOpen, setIsSharedOpen] = useState(true);

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
            <aside
                className={`border-r bg-muted/30 transition-all duration-300 ${isCollapsed ? "w-10" : "w-64"}`}
            >
                {!isCollapsed && (
                    <div className="p-4">
                        <h2 className="text-sm font-medium text-muted-foreground mb-4">Folders</h2>
                        <div className="text-sm text-muted-foreground">Sign in to view folders</div>
                    </div>
                )}
                <CollapseToggle
                    isCollapsed={isCollapsed}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                />
            </aside>
        );
    }

    return (
        <aside
            className={`border-r bg-muted/30 flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? "w-10" : "w-64"}`}
        >
            {/* Header row */}
            <div className="p-2 border-b flex items-center justify-between min-h-[49px]">
                {!isCollapsed && (
                    <h2 className="text-sm font-semibold text-foreground px-1">Library</h2>
                )}
                <CollapseToggle
                    isCollapsed={isCollapsed}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {!isCollapsed && (
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* My Library section */}
                    <div className="flex flex-col">
                        <SectionHeader
                            icon={<FolderOpen className="h-3.5 w-3.5" />}
                            label="My Library"
                            isOpen={isLibraryOpen}
                            onToggle={() => setIsLibraryOpen(!isLibraryOpen)}
                        />
                        {isLibraryOpen && (
                            <div className="p-2">
                                <FolderTree />
                            </div>
                        )}
                    </div>

                    <div className="border-t" />

                    {/* Shared with me section */}
                    <div className="flex flex-col">
                        <SectionHeader
                            icon={<Share2 className="h-3.5 w-3.5" />}
                            label="Shared with me"
                            isOpen={isSharedOpen}
                            onToggle={() => setIsSharedOpen(!isSharedOpen)}
                        />
                        {isSharedOpen && <SharedResourcesList />}
                    </div>
                </div>
            )}
        </aside>
    );
}

function SectionHeader({
    icon,
    label,
    isOpen,
    onToggle,
}: {
    icon: React.ReactNode;
    label: string;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors shrink-0"
        >
            <span className="flex items-center gap-2">
                {icon}
                {label}
            </span>
            {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
        </button>
    );
}

function CollapseToggle({ isCollapsed, onClick }: { isCollapsed: boolean; onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClick}>
            {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
            ) : (
                <ChevronLeft className="h-4 w-4" />
            )}
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
