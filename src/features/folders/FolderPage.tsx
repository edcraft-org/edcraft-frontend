import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/shared/stores/user.store";
import { apiClient, queryKeys } from "@/shared/services";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { ROUTES } from "@/router/paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder, FileText, LayoutTemplate, Plus, MoreVertical } from "lucide-react";
import type { FolderContents, FolderPath } from "./types/folder.types";

function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user, rootFolderId } = useUserStore();

  // Redirect to root if folderId is "root"
  const actualFolderId = folderId === "root" ? rootFolderId : folderId;

  // Fetch folder contents
  const { data: contents, isLoading: contentsLoading } = useQuery({
    queryKey: queryKeys.folders.contents(actualFolderId || ""),
    queryFn: () => apiClient.get<FolderContents>(`/folders/${actualFolderId}/contents`),
    enabled: !!actualFolderId && !!user,
  });

  // Fetch folder path for breadcrumbs
  const { data: path = [] } = useQuery({
    queryKey: queryKeys.folders.path(actualFolderId || ""),
    queryFn: () => apiClient.get<FolderPath[]>(`/folders/${actualFolderId}/path`),
    enabled: !!actualFolderId && !!user,
  });

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Please select a user to view folders
      </div>
    );
  }

  if (contentsLoading) {
    return <PageSkeleton />;
  }

  if (!contents) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Folder not found
      </div>
    );
  }

  const allResources = [
    ...contents.folders.map((f) => ({ ...f, resourceType: "folder" as const })),
    ...contents.assessments.map((a) => ({ ...a, resourceType: "assessment" as const })),
    ...contents.assessment_templates.map((t) => ({
      ...t,
      resourceType: "assessment_template" as const,
    })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {path.map((folder, index) => (
            <BreadcrumbItem key={folder.id}>
              {index < path.length - 1 ? (
                <>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(ROUTES.FOLDER(folder.id));
                    }}
                  >
                    {folder.name}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{contents.folder.name}</h1>
          {contents.folder.description && (
            <p className="text-muted-foreground mt-1">{contents.folder.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              New Assessment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              New Assessment Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resource Grid */}
      {allResources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>This folder is empty</p>
          <p className="text-sm">Create a new folder, assessment, or template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allResources.map((resource) => (
            <Card
              key={resource.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (resource.resourceType === "folder") {
                  navigate(ROUTES.FOLDER(resource.id));
                } else if (resource.resourceType === "assessment") {
                  navigate(ROUTES.ASSESSMENT(resource.id));
                } else {
                  navigate(ROUTES.ASSESSMENT_TEMPLATE(resource.id));
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {resource.resourceType === "folder" && (
                      <Folder className="h-5 w-5 text-blue-500" />
                    )}
                    {resource.resourceType === "assessment" && (
                      <FileText className="h-5 w-5 text-green-500" />
                    )}
                    {resource.resourceType === "assessment_template" && (
                      <LayoutTemplate className="h-5 w-5 text-purple-500" />
                    )}
                    <CardTitle className="text-base">{resource.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Move</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              {resource.description && (
                <CardContent>
                  <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default FolderPage;
