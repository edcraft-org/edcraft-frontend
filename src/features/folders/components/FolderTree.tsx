import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, queryKeys } from "@/shared/services";
import { useFolderStore } from "@/shared/stores/folder.store";
import { TreeSkeleton } from "@/shared/components/LoadingSkeleton";
import { ROUTES } from "@/router/paths";
import { cn } from "@/lib/utils";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import type { Folder as FolderType } from "../types/folder.types";

interface FolderTreeProps {
  rootFolderId: string;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
}

function FolderNode({ folder, level }: FolderNodeProps) {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const { expandedFolderIds, toggleFolderExpanded } = useFolderStore();

  const isExpanded = expandedFolderIds.has(folder.id);
  const isSelected = folderId === folder.id;

  // Fetch children when expanded
  const { data: children = [] } = useQuery({
    queryKey: queryKeys.folders.tree(folder.id),
    queryFn: () =>
      apiClient.get<FolderType[]>(`/folders?owner_id=${folder.owner_id}&parent_id=${folder.id}`),
    enabled: isExpanded,
  });

  const handleClick = () => {
    navigate(ROUTES.FOLDER(folder.id));
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
          isSelected && "bg-accent"
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
            <FolderNode key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ rootFolderId }: FolderTreeProps) {
  // Fetch root folder
  const { data: rootFolder, isLoading } = useQuery({
    queryKey: queryKeys.folders.detail(rootFolderId),
    queryFn: () => apiClient.get<FolderType>(`/folders/${rootFolderId}`),
  });

  if (isLoading) {
    return <TreeSkeleton />;
  }

  if (!rootFolder) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        No folders found
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <FolderNode folder={rootFolder} level={0} />
    </div>
  );
}
