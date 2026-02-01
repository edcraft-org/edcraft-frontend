// FolderPage - View and manage folder contents

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserStore } from "@/shared/stores/user.store";
import { ApiError } from "@/api/client";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { ROUTES } from "@/router/paths";
import { Folder as FolderIcon } from "lucide-react";
import {
    CreateFolderModal,
    CreateAssessmentModal,
    CreateAssessmentTemplateModal,
    RenameModal,
    MoveModal,
    DeleteConfirmationDialog,
    FolderBreadcrumbs,
    NewResourceDropdown,
    ResourceCard,
} from "./components";
import {
    useCreateFolder,
    useUpdateFolder,
    useMoveFolder,
    useDeleteFolder,
    useFolderContents,
    useFolderPath,
} from "./useFolders";
import { type Resource, getResourceDisplayName } from "./types";
import {
    useCreateAssessment,
    useUpdateAssessment,
    useDeleteAssessment,
} from "@/features/assessments/useAssessments";
import {
    useCreateAssessmentTemplate,
    useUpdateAssessmentTemplate,
    useDeleteAssessmentTemplate,
} from "@/features/assessment-templates/useAssessmentTemplates";

function FolderPage() {
    const { folderId } = useParams<{ folderId: string }>();
    const navigate = useNavigate();
    const { user, hasHydrated } = useUserStore();

    // Modal state
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showCreateAssessment, setShowCreateAssessment] = useState(false);
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);

    // Action modal state - single resource with modal type
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [activeModal, setActiveModal] = useState<"rename" | "move" | "delete" | null>(null);

    // Mutations
    const createFolder = useCreateFolder();
    const createAssessment = useCreateAssessment();
    const createAssessmentTemplate = useCreateAssessmentTemplate();

    // Update/Delete/Move mutations
    const updateFolder = useUpdateFolder();
    const moveFolder = useMoveFolder();
    const deleteFolder = useDeleteFolder();
    const updateAssessment = useUpdateAssessment();
    const deleteAssessment = useDeleteAssessment();
    const updateAssessmentTemplate = useUpdateAssessmentTemplate();
    const deleteAssessmentTemplate = useDeleteAssessmentTemplate();

    // Fetch folder contents
    const {
        data: contents,
        isLoading: contentsLoading,
        error: contentsError,
    } = useFolderContents(folderId);

    // Fetch folder path for breadcrumbs
    const { data: pathData } = useFolderPath(folderId);

    // Extract path array from response
    const path = pathData?.path || [];

    // Validation Helpers
    const validateSession = (): { folderId: string; userId: string } | null => {
        if (!user) {
            toast.error("Please log in to continue");
            return null;
        }
        if (!folderId) {
            toast.error("Folder ID is missing");
            return null;
        }
        return { folderId: folderId!, userId: user.id };
    };

    // Reusable error handler for mutations
    const handleMutationError = (error: Error, operationName: string) => {
        toast.error(`Failed to ${operationName}: ${error.message}`);
    };

    // Resource type configuration
    const resourceConfig = {
        folder: {
            label: "Folder",
            mutations: {
                update: updateFolder,
                move: moveFolder,
                delete: deleteFolder,
            },
        },
        assessment: {
            label: "Assessment",
            mutations: {
                update: updateAssessment,
                move: updateAssessment,
                delete: deleteAssessment,
            },
        },
        assessment_template: {
            label: "Assessment template",
            mutations: {
                update: updateAssessmentTemplate,
                move: updateAssessmentTemplate,
                delete: deleteAssessmentTemplate,
            },
        },
    } as const;

    // Create Handlers
    const handleCreateFolder = (name: string, description?: string) => {
        if (createFolder.isPending) return;

        const session = validateSession();
        if (!session) return;

        createFolder.mutate(
            {
                owner_id: session.userId,
                parent_id: session.folderId,
                name,
                description,
            },
            {
                onSuccess: () => {
                    toast.success("Folder created successfully");
                    setShowCreateFolder(false);
                },
                onError: (error) => handleMutationError(error, "create folder"),
            },
        );
    };

    const handleCreateAssessment = (title: string, description?: string) => {
        if (createAssessment.isPending) return;

        const session = validateSession();
        if (!session) return;

        createAssessment.mutate(
            {
                owner_id: session.userId,
                folder_id: session.folderId,
                title,
                description,
            },
            {
                onSuccess: (newAssessment) => {
                    toast.success("Assessment created successfully");
                    setShowCreateAssessment(false);
                    navigate(ROUTES.ASSESSMENT(newAssessment.id));
                },
                onError: (error) => handleMutationError(error, "create assessment"),
            },
        );
    };

    const handleCreateAssessmentTemplate = (title: string, description?: string) => {
        if (createAssessmentTemplate.isPending) return;

        const session = validateSession();
        if (!session) return;

        createAssessmentTemplate.mutate(
            {
                owner_id: session.userId,
                folder_id: session.folderId,
                title,
                description,
            },
            {
                onSuccess: (newTemplate) => {
                    toast.success("Assessment template created successfully");
                    setShowCreateTemplate(false);
                    navigate(ROUTES.ASSESSMENT_TEMPLATE(newTemplate.id));
                },
                onError: (error) => handleMutationError(error, "create template"),
            },
        );
    };

    // Rename Handlers
    const handleRename = (name: string, description?: string) => {
        if (!selectedResource) return;

        const session = validateSession();
        if (!session) return;

        const { resourceType, id } = selectedResource;
        const config = resourceConfig[resourceType];

        const onSuccess = () => {
            toast.success(`${config.label} renamed successfully`);
            closeActionModal();
        };
        const onError = (error: Error) =>
            handleMutationError(error, `rename ${config.label.toLowerCase()}`);

        if (resourceType === "folder") {
            if (updateFolder.isPending) return;
            updateFolder.mutate({ folderId: id, data: { name, description } }, { onSuccess, onError });
        } else if (resourceType === "assessment") {
            if (updateAssessment.isPending) return;
            updateAssessment.mutate(
                { assessmentId: id, data: { title: name, description }, oldFolderId: session.folderId },
                { onSuccess, onError },
            );
        } else {
            if (updateAssessmentTemplate.isPending) return;
            updateAssessmentTemplate.mutate(
                { templateId: id, data: { title: name, description }, oldFolderId: session.folderId },
                { onSuccess, onError },
            );
        }
    };

    // Move Handlers
    const handleMove = (targetFolderId: string) => {
        if (!selectedResource) return;

        const session = validateSession();
        if (!session) return;

        const { resourceType, id } = selectedResource;
        const config = resourceConfig[resourceType];

        const onSuccess = () => {
            toast.success(`${config.label} moved successfully`);
            closeActionModal();
        };
        const onError = (error: Error) =>
            handleMutationError(error, `move ${config.label.toLowerCase()}`);

        if (resourceType === "folder") {
            if (moveFolder.isPending) return;
            moveFolder.mutate(
                { folderId: id, data: { parent_id: targetFolderId }, oldParentId: session.folderId },
                { onSuccess, onError },
            );
        } else if (resourceType === "assessment") {
            if (updateAssessment.isPending) return;
            updateAssessment.mutate(
                { assessmentId: id, data: { folder_id: targetFolderId }, oldFolderId: session.folderId },
                { onSuccess, onError },
            );
        } else {
            if (updateAssessmentTemplate.isPending) return;
            updateAssessmentTemplate.mutate(
                { templateId: id, data: { folder_id: targetFolderId }, oldFolderId: session.folderId },
                { onSuccess, onError },
            );
        }
    };

    // UI Event Handlers
    const handleResourceClick = (resource: Resource) => {
        if (resource.resourceType === "folder") {
            navigate(ROUTES.FOLDER(resource.id));
        } else if (resource.resourceType === "assessment") {
            navigate(ROUTES.ASSESSMENT(resource.id));
        } else {
            navigate(ROUTES.ASSESSMENT_TEMPLATE(resource.id));
        }
    };

    const handleRenameClick = (resource: Resource) => {
        setSelectedResource(resource);
        setActiveModal("rename");
    };

    const handleMoveClick = (resource: Resource) => {
        setSelectedResource(resource);
        setActiveModal("move");
    };

    const handleDeleteClick = (resource: Resource) => {
        setSelectedResource(resource);
        setActiveModal("delete");
    };

    const closeActionModal = () => {
        setActiveModal(null);
        setSelectedResource(null);
    };

    // Delete Handlers
    const handleDelete = () => {
        if (!selectedResource) return;

        const session = validateSession();
        if (!session) return;

        const { resourceType, id } = selectedResource;
        const config = resourceConfig[resourceType];

        const onSuccess = () => {
            toast.success(`${config.label} deleted successfully`);
            closeActionModal();
        };
        const onError = (error: Error) =>
            handleMutationError(error, `delete ${config.label.toLowerCase()}`);

        if (resourceType === "folder") {
            if (deleteFolder.isPending) return;
            deleteFolder.mutate(
                { folderId: id, ownerId: session.userId, parentId: folderId ?? undefined },
                { onSuccess, onError },
            );
        } else if (resourceType === "assessment") {
            if (deleteAssessment.isPending) return;
            deleteAssessment.mutate(
                { assessmentId: id, ownerId: session.userId, folderId: session.folderId },
                { onSuccess, onError },
            );
        } else {
            if (deleteAssessmentTemplate.isPending) return;
            deleteAssessmentTemplate.mutate(
                { templateId: id, ownerId: session.userId, folderId: session.folderId },
                { onSuccess, onError },
            );
        }
    };

    // Early returns for loading and error states
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

    if (contentsError) {
        if (contentsError instanceof ApiError && contentsError.status === 404) {
            return <div className="p-6 text-center text-muted-foreground">Folder not found</div>;
        }
        return (
            <div className="p-6 text-center text-muted-foreground">
                Error loading folder: {contentsError.message}
            </div>
        );
    }

    const allResources = [
        ...(contents?.folders ?? []).map((f) => ({ ...f, resourceType: "folder" as const })),
        ...(contents?.assessments ?? []).map((a) => ({
            ...a,
            resourceType: "assessment" as const,
        })),
        ...(contents?.assessment_templates ?? []).map((t) => ({
            ...t,
            resourceType: "assessment_template" as const,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Breadcrumbs */}
            <FolderBreadcrumbs path={path} onNavigate={(id) => navigate(ROUTES.FOLDER(id))} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{contents?.name}</h1>
                    {contents?.description && (
                        <p className="text-muted-foreground mt-1">{contents?.description}</p>
                    )}
                </div>
                <NewResourceDropdown
                    onCreateFolder={() => setShowCreateFolder(true)}
                    onCreateAssessment={() => setShowCreateAssessment(true)}
                    onCreateTemplate={() => setShowCreateTemplate(true)}
                />
            </div>

            {/* Resource Grid */}
            {allResources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <FolderIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>This folder is empty</p>
                    <p className="text-sm">
                        Create a new folder, assessment, or template to get started
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allResources.map((resource) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            onClick={() => handleResourceClick(resource)}
                            onRename={() => handleRenameClick(resource)}
                            onMove={() => handleMoveClick(resource)}
                            onDelete={() => handleDeleteClick(resource)}
                        />
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

            {/* Action Modals */}
            <RenameModal
                open={activeModal === "rename"}
                onOpenChange={(open) => !open && closeActionModal()}
                onSubmit={handleRename}
                isLoading={
                    updateFolder.isPending ||
                    updateAssessment.isPending ||
                    updateAssessmentTemplate.isPending
                }
                resourceType={selectedResource?.resourceType ?? "folder"}
                currentName={selectedResource ? getResourceDisplayName(selectedResource) : ""}
                currentDescription={selectedResource?.description}
            />

            <MoveModal
                open={activeModal === "move"}
                onOpenChange={(open) => !open && closeActionModal()}
                onSubmit={handleMove}
                isLoading={
                    moveFolder.isPending ||
                    updateAssessment.isPending ||
                    updateAssessmentTemplate.isPending
                }
                resourceType={selectedResource?.resourceType ?? "folder"}
                ownerId={user?.id || ""}
                originalFolderId={folderId || ""}
            />

            <DeleteConfirmationDialog
                open={activeModal === "delete"}
                onOpenChange={(open) => !open && closeActionModal()}
                onConfirm={handleDelete}
                isLoading={
                    deleteFolder.isPending ||
                    deleteAssessment.isPending ||
                    deleteAssessmentTemplate.isPending
                }
                resourceType={selectedResource?.resourceType ?? "folder"}
                resourceName={selectedResource ? getResourceDisplayName(selectedResource) : ""}
            />
        </div>
    );
}

export default FolderPage;
