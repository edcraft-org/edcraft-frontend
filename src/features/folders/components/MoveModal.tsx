// MoveModal - Modal for moving folders, assessments, and assessment templates to a different folder

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Folder, FolderOpen, ChevronRight } from "lucide-react";
import { apiClient, queryKeys } from "@/shared/services";
import { cn } from "@/lib/utils";
import type { Folder as FolderType } from '@/types/frontend.types';

interface MoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (targetFolderId: string) => void;
  isLoading?: boolean;
  resourceType: "folder" | "assessment" | "assessment_template";
  resourceName: string;
  rootFolderId: string;
  ownerId: string;
  currentFolderId?: string;
  excludeFolderId?: string; // For folders, exclude self and children
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  selectedId: string | null;
  onSelect: (folderId: string) => void;
  excludeFolderId?: string;
}

function FolderNode({ folder, level, selectedId, onSelect, excludeFolderId }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedId === folder.id;
  const isExcluded = excludeFolderId === folder.id;

  // Fetch children when expanded
  const { data: children = [] } = useQuery({
    queryKey: queryKeys.folders.tree(folder.id),
    queryFn: () =>
      apiClient.get<FolderType[]>(`/folders?owner_id=${folder.owner_id}&parent_id=${folder.id}`),
    enabled: isExpanded && !isExcluded,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExcluded) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (!isExcluded) {
      onSelect(folder.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
          isSelected && "bg-accent",
          isExcluded && "opacity-50 cursor-not-allowed"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        <button
          onClick={handleToggle}
          className="p-0.5 hover:bg-muted rounded"
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          disabled={isExcluded}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
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

      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              excludeFolderId={excludeFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MoveModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  resourceType,
  resourceName,
  rootFolderId,
  ownerId: _ownerId,
  currentFolderId,
  excludeFolderId,
}: MoveModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch root folder
  const { data: rootFolder, isLoading: isLoadingRoot } = useQuery({
    queryKey: queryKeys.folders.detail(rootFolderId),
    queryFn: () => apiClient.get<FolderType>(`/folders/${rootFolderId}`),
    enabled: open,
  });

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedFolderId(null);
    }
  };

  const handleSubmit = () => {
    if (selectedFolderId && selectedFolderId !== currentFolderId) {
      onSubmit(selectedFolderId);
    }
  };

  const getTitle = () => {
    switch (resourceType) {
      case "folder":
        return "Move Folder";
      case "assessment":
        return "Move Assessment";
      case "assessment_template":
        return "Move Assessment Template";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Select a destination folder for "{resourceName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingRoot ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rootFolder ? (
            <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
              <FolderNode
                folder={rootFolder}
                level={0}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
                excludeFolderId={excludeFolderId}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              No folders found
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFolderId || selectedFolderId === currentFolderId || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
