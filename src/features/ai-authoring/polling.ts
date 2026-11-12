import { ApiError } from "@/api/axiosInstance";

export const ACTIVE_JOB_POLL_MS = 2000;

/**
 * Keep polling active jobs through transient failures by using the last known
 * state, but stop on auth/not-found errors instead of polling them forever.
 */
export function nextJobPollingInterval(
    lastKnownState: string | undefined,
    error: unknown,
): number | false {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return false;
    }
    return lastKnownState === "queued" || lastKnownState === "running"
        ? ACTIVE_JOB_POLL_MS
        : false;
}
