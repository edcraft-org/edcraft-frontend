// CollaborationModal - Manage collaborators for a resource (assessment, etc.)

import { useState } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus, Trash2, Crown, Pencil, Eye, Lock, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CollaboratorRole, ResourceVisibility } from "@/api/models";
import type { CollaboratorResponse, ResourcePath } from "@/api/models";
import {
    useCollaborators,
    useAddCollaborator,
    useUpdateCollaboratorRole,
    useRemoveCollaborator,
} from "@/shared/hooks/useCollaborators";

const addCollaboratorSchema = z.object({
    email: z.email("Enter a valid email address"),
    role: z.enum([CollaboratorRole.editor, CollaboratorRole.viewer]),
});

type AddCollaboratorValues = z.infer<typeof addCollaboratorSchema>;

interface CollaborationModalProps {
    resourcePath: ResourcePath;
    resourceId: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    myRole: CollaboratorRole;
    currentVisibility: ResourceVisibility;
    onVisibilityChange: (visibility: ResourceVisibility) => void;
    isVisibilityUpdating: boolean;
    resourceDetailQueryKey: QueryKey;
}

const ROLE_LABELS: Record<CollaboratorRole, string> = {
    owner: "Owner",
    editor: "Editor",
    viewer: "Viewer",
};

const RoleIcon = ({ role }: { role: CollaboratorRole }) => {
    if (role === CollaboratorRole.owner) return <Crown className="h-3 w-3" />;
    if (role === CollaboratorRole.editor) return <Pencil className="h-3 w-3" />;
    return <Eye className="h-3 w-3" />;
};

const RoleBadge = ({ role }: { role: CollaboratorRole }) => {
    const variant =
        role === CollaboratorRole.owner
            ? "default"
            : role === CollaboratorRole.editor
              ? "secondary"
              : "outline";
    return (
        <Badge variant={variant} className="flex items-center gap-1 text-xs">
            <RoleIcon role={role} />
            {ROLE_LABELS[role]}
        </Badge>
    );
};

export function CollaborationModal({
    resourcePath,
    resourceId,
    isOpen,
    onOpenChange,
    myRole,
    currentVisibility,
    onVisibilityChange,
    isVisibilityUpdating,
    resourceDetailQueryKey,
}: CollaborationModalProps) {
    const canManage = myRole === CollaboratorRole.owner || myRole === CollaboratorRole.editor;
    const isOwner = myRole === CollaboratorRole.owner;

    const { data: collaborators, isLoading } = useCollaborators(resourcePath, resourceId, canManage);
    const addCollaborator = useAddCollaborator(resourcePath);
    const updateRole = useUpdateCollaboratorRole(resourcePath, resourceDetailQueryKey);
    const removeCollaborator = useRemoveCollaborator(resourcePath);

    const addForm = useForm<AddCollaboratorValues>({
        resolver: zodResolver(addCollaboratorSchema),
        defaultValues: { email: "", role: CollaboratorRole.viewer },
    });

    // Ownership transfer confirmation state
    const [pendingTransfer, setPendingTransfer] = useState<{
        collaboratorId: string;
        targetName: string;
    } | null>(null);

    const handleAdd = (values: AddCollaboratorValues) => {
        addCollaborator.mutate(
            { resourceId, email: values.email, role: values.role },
            {
                onSuccess: () => {
                    addForm.reset();
                    toast.success("Collaborator added");
                },
                onError: (err: Error) => {
                    const msg = err.message.toLowerCase();
                    if (msg.includes("404") || msg.includes("not found")) {
                        addForm.setError("email", { message: "No user found with that email" });
                    } else if (msg.includes("409") || msg.includes("duplicate")) {
                        addForm.setError("email", { message: "User is already a collaborator" });
                    } else {
                        toast.error("Failed to add collaborator");
                    }
                },
            },
        );
    };

    const handleRoleChange = (collab: CollaboratorResponse, newRole: CollaboratorRole) => {
        if (newRole === CollaboratorRole.owner) {
            setPendingTransfer({ collaboratorId: collab.id, targetName: collab.user_name });
            return;
        }
        updateRole.mutate(
            { resourceId, collaboratorId: collab.id, role: newRole },
            { onError: () => toast.error("Failed to update role") },
        );
    };

    const confirmTransfer = () => {
        if (!pendingTransfer) return;
        updateRole.mutate(
            {
                resourceId,
                collaboratorId: pendingTransfer.collaboratorId,
                role: CollaboratorRole.owner,
            },
            {
                onSuccess: () => {
                    toast.success("Ownership transferred");
                    setPendingTransfer(null);
                },
                onError: () => {
                    toast.error("Failed to transfer ownership");
                    setPendingTransfer(null);
                },
            },
        );
    };

    const handleRemove = (collab: CollaboratorResponse) => {
        removeCollaborator.mutate(
            { resourceId, collaboratorId: collab.id },
            { onError: () => toast.error("Failed to remove collaborator") },
        );
    };

    const handleVisibilityChange = (value: string) => {
        if (!onVisibilityChange || value === currentVisibility) return;
        onVisibilityChange(value as ResourceVisibility);
    };

    const assignableRoles: CollaboratorRole[] = isOwner
        ? [CollaboratorRole.owner, CollaboratorRole.editor, CollaboratorRole.viewer]
        : [CollaboratorRole.editor, CollaboratorRole.viewer];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage collaborators</DialogTitle>
                    </DialogHeader>

                    {/* Collaborator list */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {isLoading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))
                        ) : collaborators && collaborators.length > 0 ? (
                            collaborators.map((collab) => {
                                const isCollabOwner = collab.role === CollaboratorRole.owner;
                                return (
                                    <div
                                        key={collab.id}
                                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {collab.user_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {collab.user_email}
                                            </p>
                                        </div>

                                        {/* Role control */}
                                        {isCollabOwner || !canManage ? (
                                            <RoleBadge role={collab.role} />
                                        ) : (
                                            <Select
                                                value={collab.role}
                                                onValueChange={(val) =>
                                                    handleRoleChange(
                                                        collab,
                                                        val as CollaboratorRole,
                                                    )
                                                }
                                                disabled={updateRole.isPending}
                                            >
                                                <SelectTrigger className="h-7 w-28 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assignableRoles.map((r) => (
                                                        <SelectItem
                                                            key={r}
                                                            value={r}
                                                            className="text-xs"
                                                        >
                                                            {ROLE_LABELS[r]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* Remove button — not available for owner row */}
                                        {!isCollabOwner && canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemove(collab)}
                                                disabled={removeCollaborator.isPending}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No collaborators yet.
                            </p>
                        )}
                    </div>

                    {/* Visibility section — owner only */}
                    {canManage && (
                        <div className="border-t pt-4 space-y-2">
                            <p className="text-sm font-medium">Visibility</p>
                            <RadioGroup
                                value={currentVisibility}
                                onValueChange={handleVisibilityChange}
                                disabled={isVisibilityUpdating}
                                className="space-y-1"
                            >
                                <label className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value={ResourceVisibility.private} />
                                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Restricted</p>
                                        <p className="text-xs text-muted-foreground">
                                            Only collaborators can view
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
                                    <RadioGroupItem value={ResourceVisibility.public} />
                                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Public</p>
                                        <p className="text-xs text-muted-foreground">
                                            Anyone with link can view
                                        </p>
                                    </div>
                                </label>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Add collaborator section */}
                    {canManage && (
                        <div className="border-t pt-4 space-y-2">
                            <p className="text-sm font-medium">Add collaborator</p>
                            <Form {...addForm}>
                                <form
                                    onSubmit={addForm.handleSubmit(handleAdd)}
                                    className="space-y-1"
                                >
                                    <div className="flex gap-2">
                                        <FormField
                                            control={addForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Email address"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addForm.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-28">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem
                                                                value={CollaboratorRole.editor}
                                                            >
                                                                Editor
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={CollaboratorRole.viewer}
                                                            >
                                                                Viewer
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={addCollaborator.isPending}
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Ownership transfer confirmation */}
            <AlertDialog open={!!pendingTransfer} onOpenChange={() => setPendingTransfer(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{pendingTransfer?.targetName}</strong> will become the new
                            owner. You will be downgraded to editor and will no longer be able to
                            transfer ownership.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTransfer}>Transfer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
