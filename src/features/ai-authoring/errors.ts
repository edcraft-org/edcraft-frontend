import { ApiError } from "@/api/axiosInstance";

export function getAuthoringErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Please sign in to continue.";
        if (error.status === 404) return "This authoring job was not found or is not yours.";
        if (error.status === 409) {
            return "The checked artifact changed or is no longer usable. Review the latest version.";
        }
        if (error.status === 429) {
            return "The authoring queue is full. Wait for a running job to finish and try again.";
        }
        return error.detail || fallback;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export function isStaleArtifactError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 409;
}

export function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}
