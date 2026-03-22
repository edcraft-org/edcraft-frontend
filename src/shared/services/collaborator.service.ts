// Generic collaborator service - works for any collaborable resource type

import { api } from "@/api/client";
import type { CollaboratorResponse, CollaboratorRole, ResourcePath } from "@/api/models";

export async function listCollaborators(
    resourcePath: ResourcePath,
    resourceId: string,
): Promise<CollaboratorResponse[]> {
    const response = await api.listCollaboratorsResourcePathResourceIdCollaboratorsGet(
        resourcePath,
        resourceId,
    );
    return response.data;
}

export async function addCollaborator(
    resourcePath: ResourcePath,
    resourceId: string,
    email: string,
    role: CollaboratorRole,
): Promise<CollaboratorResponse> {
    const response = await api.addCollaboratorResourcePathResourceIdCollaboratorsPost(
        resourcePath,
        resourceId,
        { email, role },
    );
    return response.data;
}

export async function updateCollaboratorRole(
    resourcePath: ResourcePath,
    resourceId: string,
    collaboratorId: string,
    role: CollaboratorRole,
): Promise<CollaboratorResponse> {
    const response =
        await api.updateCollaboratorRoleResourcePathResourceIdCollaboratorsCollaboratorIdPatch(
            resourcePath,
            resourceId,
            collaboratorId,
            { role },
        );
    return response.data;
}

export async function removeCollaborator(
    resourcePath: ResourcePath,
    resourceId: string,
    collaboratorId: string,
): Promise<void> {
    await api.removeCollaboratorResourcePathResourceIdCollaboratorsCollaboratorIdDelete(
        resourcePath,
        resourceId,
        collaboratorId,
    );
}
