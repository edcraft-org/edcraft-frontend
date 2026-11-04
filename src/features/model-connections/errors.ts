import { ApiError } from "@/api/axiosInstance";

/** Format provider-connection API failures without leaking request bodies. */
export function getConnectionErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Please sign in to continue.";
        if (error.detail.trim()) return error.detail;
        return fallback;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
}
