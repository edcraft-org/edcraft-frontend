import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStore } from "@/shared/stores/user.store";
import { apiClient, queryKeys, ApiError } from "@/shared/services";
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
import {
  CreateFolderModal,
  CreateAssessmentModal,
  CreateAssessmentTemplateModal,
} from "./components";
import { useCreateFolder } from "./hooks/useFolders";
import { useCreateAssessment } from "@/features/assessments/hooks/useAssessments";
import { useCreateAssessmentTemplate } from "@/features/assessment-templates/hooks/useAssessmentTemplates";

function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user, rootFolderId, hasHydrated } = useUserStore();

  // Modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  // Mutations
  const createFolder = useCreateFolder();
  const createAssessment = useCreateAssessment();
  const createAssessmentTemplate = useCreateAssessmentTemplate();

  // Redirect to root if folderId is "root"
  const actualFolderId = folderId === "root" ? rootFolderId : folderId;

  // Determine if this is the root folder
  const isRootFolder = folderId === "root" || actualFolderId === rootFolderId;

  // Fetch folder contents
  const {
    data: contents,
    isLoading: contentsLoading,
    error: contentsError,
  } = useQuery({
    queryKey: queryKeys.folders.contents(actualFolderId || ""),
    queryFn: () => apiClient.get<FolderContents>(`/folders/${actualFolderId}/contents`),
    enabled: !!actualFolderId && !!user,
  });

  // Fetch folder path for breadcrumbs
  const { data: pathData } = useQuery({
    queryKey: queryKeys.folders.path(actualFolderId || ""),
    queryFn: () => apiClient.get<FolderPath[] | { path: FolderPath[] }>(`/folders/${actualFolderId}/path`),
    enabled: !!actualFolderId && !!user,
  });

  // Handle both array and object response formats from the backend
  const path = Array.isArray(pathData) ? pathData : (pathData?.path || []);

  // Handlers
  const handleCreateFolder = (name: string, description?: string) => {
    if (!user || !actualFolderId) return;

    createFolder.mutate(
      {
        owner_id: user.id,
        parent_id: actualFolderId,
        name,
        description,
      },
      {
        onSuccess: () => {
          toast.success("Folder created successfully");
          setShowCreateFolder(false);
        },
        onError: (error) => {
          toast.error(`Failed to create folder: ${error.message}`);
        },
      }
    );
  };

  const handleCreateAssessment = (title: string, description?: string) => {
    if (!user || !actualFolderId) return;

    createAssessment.mutate(
      {
        owner_id: user.id,
        folder_id: actualFolderId,
        title,
        description,
      },
      {
        onSuccess: (newAssessment) => {
          toast.success("Assessment created successfully");
          setShowCreateAssessment(false);
          navigate(ROUTES.ASSESSMENT(newAssessment.id));
        },
        onError: (error) => {
          toast.error(`Failed to create assessment: ${error.message}`);
        },
      }
    );
  };

  const handleCreateAssessmentTemplate = (title: string, description?: string) => {
    if (!user || !actualFolderId) return;

    createAssessmentTemplate.mutate(
      {
        owner_id: user.id,
        folder_id: actualFolderId,
        title,
        description,
      },
      {
        onSuccess: (newTemplate) => {
          toast.success("Assessment template created successfully");
          setShowCreateTemplate(false);
          navigate(ROUTES.ASSESSMENT_TEMPLATE(newTemplate.id));
        },
        onError: (error) => {
          toast.error(`Failed to create template: ${error.message}`);
        },
      }
    );
  };

  // Show loading while Zustand is hydrating from localStorage
  if (!hasHydrated) {
    return <PageSkeleton />;
  }

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

  // Handle API errors - only show "Folder not found" for actual 404 errors
  if (contentsError) {
    if (contentsError instanceof ApiError && contentsError.status === 404) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          Folder not found
        </div>
      );
    }
    return (
      <div className="p-6 text-center text-muted-foreground">
        Error loading folder: {contentsError.message}
      </div>
    );
  }

  // Get folder display name - use "My Projects" for root folder
  const folderDisplayName = isRootFolder ? "My Projects" : contents?.name ?? "Folder";
  const folderDescription = contents?.description;

  const allResources = [
    ...(contents?.folders ?? []).map((f) => ({ ...f, resourceType: "folder" as const })),
    ...(contents?.assessments ?? []).map((a) => ({ ...a, resourceType: "assessment" as const })),
    ...(contents?.assessment_templates ?? []).map((t) => ({
      ...t,
      resourceType: "assessment_template" as const,
    })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {path.map((folder, index) => {
            // Use "My Projects" for root folder in breadcrumbs
            const displayName = folder.id === rootFolderId ? "My Projects" : folder.name;
            return (
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
                      {displayName}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{folderDisplayName}</h1>
          {folderDescription && (
            <p className="text-muted-foreground mt-1">{folderDescription}</p>
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
            <DropdownMenuItem onClick={() => setShowCreateFolder(true)}>
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateAssessment(true)}>
              <FileText className="h-4 w-4 mr-2" />
              New Assessment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateTemplate(true)}>
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
                      {/* Only show delete for non-root folders */}
                      {!(resource.resourceType === "folder" && resource.id === rootFolderId) && (
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      )}
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

      {/* Modals */}
      <CreateFolderModal
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onSubmit={handleCreateFolder}
        isLoading={createFolder.isPending}
      />

      <CreateAssessmentModal
        open={showCreateAssessment}
        onOpenChange={setShowCreateAssessment}
        onSubmit={handleCreateAssessment}
        isLoading={createAssessment.isPending}
      />

      <CreateAssessmentTemplateModal
        open={showCreateTemplate}
        onOpenChange={setShowCreateTemplate}
        onSubmit={handleCreateAssessmentTemplate}
        isLoading={createAssessmentTemplate.isPending}
      />
    </div>
  );
}

export default FolderPage;
