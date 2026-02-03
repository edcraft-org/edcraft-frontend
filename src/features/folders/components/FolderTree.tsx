import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFolderStore } from "@/shared/stores/folder.store";
import { useUserStore } from "@/shared/stores/user.store";
import { useFolderPath, useFolders } from "../useFolders";
import { TreeSkeleton } from "@/shared/components/LoadingSkeleton";
import { ROUTES } from "@/router/paths";
import { cn } from "@/lib/utils";
import { ChevronRight, Folder, FolderOpen, Loader2, AlertCircle } from "lucide-react";
import type { FolderResponse } from "@/api/models";

interface FolderNodeProps {
    folder: FolderResponse;
    level: number;
    currentFolderId: string | undefined;
    onNavigate: (folderId: string) => void;
}

function FolderNode({ folder, level, currentFolderId, onNavigate }: FolderNodeProps) {
    const { expandedFolderIds, toggleFolderExpanded } = useFolderStore();

    const isExpanded = expandedFolderIds.has(folder.id);
    const isSelected = currentFolderId === folder.id;

    const {
        data: children,
        isLoading: isLoadingChildren,
        isError: isChildrenError,
    } = useFolders({ owner_id: folder.owner_id, parent_id: folder.id }, { enabled: isExpanded });

    const handleClick = () => {
        onNavigate(folder.id);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFolderExpanded(folder.id);
    };

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                    isSelected && "bg-accent",
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                <button
                    onClick={handleToggle}
                    className="p-0.5 hover:bg-muted rounded"
                    aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
                >
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90",
                        )}
                    />
                </button>
                {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                    <Folder className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm truncate">{folder.name}</span>
            </div>

            {isExpanded && (
                <div>
                    {isLoadingChildren && (
                        <div
                            className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
                            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                        >
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Loading...</span>
                        </div>
                    )}
                    {isChildrenError && (
                        <div
                            className="flex items-center gap-2 py-1.5 text-sm text-destructive"
                            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                        >
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed to load folders</span>
                        </div>
                    )}
                    {!isLoadingChildren && !isChildrenError && children?.length === 0 && (
                        <div
                            className="py-1.5 text-sm text-muted-foreground italic"
                            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
                        >
                            No subfolders
                        </div>
                    )}
                    {children?.map((child) => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            currentFolderId={currentFolderId}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree() {
    const navigate = useNavigate();
    const { folderId: rawFolderId } = useParams();
    const { setCurrentFolderId, addExpandedFolders } = useFolderStore();
    const { rootFolderId } = useUserStore();

    const isRootPath = rawFolderId === "root";
    const folderIdForPath = isRootPath || !rawFolderId ? (rootFolderId ?? undefined) : rawFolderId;
    const currentFolderId = rawFolderId ? (isRootPath ? (rootFolderId ?? undefined) : rawFolderId) : undefined;

    const { data: pathResponse, isLoading, isError } = useFolderPath(folderIdForPath);
    const path = pathResponse?.path;

    useEffect(() => {
        if (path && currentFolderId) {
            setCurrentFolderId(currentFolderId);
            const folderIdsToExpand = path.map((f) => f.id);
            addExpandedFolders(folderIdsToExpand);
        }
    }, [currentFolderId, path, setCurrentFolderId, addExpandedFolders]);

    const handleNavigate = (targetFolderId: string) => {
        navigate(ROUTES.FOLDER(targetFolderId));
    };

    const rootFolder = path ? path[0] : undefined;

    if (isLoading) {
        return <TreeSkeleton />;
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 p-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load folder tree</span>
            </div>
        );
    }

    if (!rootFolder) {
        return <div className="text-sm text-muted-foreground p-2">No folders found</div>;
    }

    return (
        <div className="space-y-0.5">
            <FolderNode
                folder={rootFolder}
                level={0}
                currentFolderId={currentFolderId}
                onNavigate={handleNavigate}
            />
        </div>
    );
}
