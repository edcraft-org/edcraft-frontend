import { CollaboratorRole } from "@/api/models";

export function canEditResource(role?: CollaboratorRole | null) {
    return role === CollaboratorRole.owner || role === CollaboratorRole.editor;
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unknown error";
}

export function notifyMutationError(error: unknown, operationName: string) {
    return `Failed to ${operationName}: ${getErrorMessage(error)}`;
}
