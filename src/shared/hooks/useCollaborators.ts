// Generic collaborator hooks - work for any collaborable resource type

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import {
    listCollaborators,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
} from "@/shared/services/collaborator.service";
import type { CollaboratorRole, ResourcePath } from "@/api/models";

export function useCollaborators(
    resourcePath: ResourcePath,
    resourceId: string | undefined,
    enabled: boolean,
) {
    return useQuery({
        queryKey: queryKeys.collaborators.byResource(resourcePath, resourceId || ""),
        queryFn: () => listCollaborators(resourcePath, resourceId!),
        enabled: !!resourceId && enabled,
    });
}

export function useAddCollaborator(resourcePath: ResourcePath) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            resourceId,
            email,
            role,
        }: {
            resourceId: string;
            email: string;
            role: CollaboratorRole;
        }) => addCollaborator(resourcePath, resourceId, email, role),
        onSuccess: (_, { resourceId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byResource(resourcePath, resourceId),
            });
        },
    });
}

export function useUpdateCollaboratorRole(
    resourcePath: ResourcePath,
    resourceDetailQueryKey?: readonly unknown[],
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            resourceId,
            collaboratorId,
            role,
        }: {
            resourceId: string;
            collaboratorId: string;
            role: CollaboratorRole;
        }) => updateCollaboratorRole(resourcePath, resourceId, collaboratorId, role),
        onSuccess: (_, { resourceId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byResource(resourcePath, resourceId),
            });
            // Ownership transfer changes my_role — invalidate resource detail too
            if (resourceDetailQueryKey) {
                queryClient.invalidateQueries({ queryKey: resourceDetailQueryKey });
            }
        },
    });
}

export function useRemoveCollaborator(resourcePath: ResourcePath) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            resourceId,
            collaboratorId,
        }: {
            resourceId: string;
            collaboratorId: string;
        }) => removeCollaborator(resourcePath, resourceId, collaboratorId),
        onSuccess: (_, { resourceId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.collaborators.byResource(resourcePath, resourceId),
            });
        },
    });
}
