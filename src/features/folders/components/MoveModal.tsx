// MoveModal - Modal for moving folders, assessments,
// assessment templates, and question banks to a different folder

import { useState, useEffect } from "react";
import type { ResourceType } from "../types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowUp, Folder, ChevronRight } from "lucide-react";
import { useFolders, useFolderPath } from "../useFolders";
import { FolderBreadcrumbs } from "./FolderBreadcrumbs";
import type { FolderResponse } from "@/api/models";
import { cn } from "@/lib/utils";

// Helper to format resource type for display
const formatResourceType = (type: string) => {
    return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

// Inline folder list item component
function FolderListItem({
    folder,
    isParent = false,
    isSelected,
    onClick,
}: {
    folder: FolderResponse;
    isParent?: boolean;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                "hover:bg-accent transition-colors",
                isSelected && "bg-accent ring-2 ring-ring",
            )}
            onClick={onClick}
        >
            {isParent ? (
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            ) : (
                <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-sm flex-1">{folder.name}</span>
            {!isParent && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
    );
}

interface MoveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (targetFolderId: string) => void;
    isLoading?: boolean;
    resourceType: ResourceType;
    originalFolderId: string;
}

export function MoveModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading,
    resourceType,
    originalFolderId,
}: MoveModalProps) {
    const [currentViewFolderId, setCurrentViewFolderId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setCurrentViewFolderId(originalFolderId);
            setSelectedFolderId(null);
        }
    }, [open, originalFolderId]);

    // Fetch breadcrumb path for current view
    const { data: pathResponse, isLoading: isLoadingPath } = useFolderPath(
        open && currentViewFolderId ? currentViewFolderId : undefined,
    );
    const path = pathResponse?.path || [];

    // Fetch child folders of current view
    const { data: childFolders, isLoading: isLoadingChildren } = useFolders(
        open && currentViewFolderId
            ? { parent_id: currentViewFolderId }
            : undefined,
    );

    // Get current folder (last item in path)
    const currentFolder = path[path.length - 1];
    const isAtRoot = currentFolder?.parent_id === null;

    // Check if current path includes the folder being moved (prevents circular references)
    const isCircularReference =
        resourceType === "folder" ? path.some((folder) => folder.id === originalFolderId) : false;

    // Navigation handlers
    const handleNavigateToFolder = (folderId: string) => {
        setCurrentViewFolderId(folderId);
        setSelectedFolderId(folderId);
    };

    const handleClose = () => {
        setSelectedFolderId(null);
        setCurrentViewFolderId(null);
        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (selectedFolderId && selectedFolderId !== originalFolderId) {
            onSubmit(selectedFolderId);
        }
    };

    const isDataLoading = isLoadingPath || isLoadingChildren;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Move {formatResourceType(resourceType)}</DialogTitle>
                    <DialogDescription>Navigate and select a destination folder</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Breadcrumbs */}
                    {isLoadingPath ? (
                        <div className="h-6 bg-muted animate-pulse rounded" />
                    ) : path.length > 0 ? (
                        <FolderBreadcrumbs path={path} onNavigate={handleNavigateToFolder} />
                    ) : null}

                    {/* Folder List */}
                    <div className="border rounded-md p-2 max-h-[400px] overflow-y-auto space-y-1">
                        {isDataLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : path.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                                <p className="text-sm text-destructive text-center">
                                    Failed to load folders. Please try again.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Warning if inside child folder */}
                                {isCircularReference &&
                                    originalFolderId !== currentViewFolderId && (
                                        <div className="flex items-center gap-2 p-3 mb-2 bg-destructive/10 text-destructive rounded-md">
                                            <AlertCircle className="h-4 w-4" />
                                            <p className="text-sm">
                                                Cannot move a folder into its descendants
                                            </p>
                                        </div>
                                    )}

                                {/* Child folders */}
                                {childFolders && childFolders.length > 0
                                    ? childFolders.map((folder) => (
                                          <FolderListItem
                                              key={folder.id}
                                              folder={folder}
                                              isSelected={selectedFolderId === folder.id}
                                              onClick={() => handleNavigateToFolder(folder.id)}
                                          />
                                      ))
                                    : !isAtRoot && (
                                          <p className="text-sm text-muted-foreground text-center py-4">
                                              No subfolders
                                          </p>
                                      )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            !selectedFolderId ||
                            selectedFolderId === originalFolderId ||
                            isCircularReference ||
                            isLoading
                        }
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Move Here
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
