import { ApiError } from "@/api/axiosInstance";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function formatValidationDetail(detail: unknown): string | null {
    if (!Array.isArray(detail)) return null;
    const messages = detail.flatMap((item) => {
        if (!isRecord(item) || typeof item.msg !== "string" || !item.msg.trim()) return [];
        const location = Array.isArray(item.loc)
            ? item.loc
                  .filter(
                      (part): part is string | number =>
                          typeof part === "string" || typeof part === "number",
                  )
                  .join(".")
            : "";
        return [location ? `${location}: ${item.msg}` : item.msg];
    });
    return messages.length > 0 ? messages.join("; ") : null;
}

function detailToString(detail: unknown): string | null {
    if (typeof detail === "string" && detail.trim()) return detail;
    const validation = formatValidationDetail(detail);
    if (validation) return validation;
    if (isRecord(detail) && typeof detail.message === "string" && detail.message.trim()) {
        return detail.message;
    }
    return null;
}

export function getAuthoringErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Please sign in to continue.";
        if (error.status === 404) return "This question was not found or is not yours.";
        if (error.status === 409) {
            return "The checked question changed or is no longer usable. Review the latest version.";
        }
        if (error.status === 429) {
            return "The server is busy. Wait for the current question to finish and try again.";
        }
        // FastAPI validation responses carry a detail array, not a string. Keep
        // the message boundary string-only so React never receives an object.
        return detailToString(error.detail) ?? fallback;
    }
    if (error instanceof Error) {
        return detailToString(error.message) ?? fallback;
    }
    return fallback;
}

// These conflicts all mean the cached review no longer describes the stored
// artifact. Seed or approval conflicts must not clear valid review state.
const STALE_ARTIFACT_DETAIL =
    /artifact (changed|failed its integrity check|is not usable|identity does not match)|validated artifact is unavailable/i;

export function isStaleArtifactError(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.status !== 409) return false;
    const detail = detailToString(error.detail);
    return detail ? STALE_ARTIFACT_DETAIL.test(detail) : false;
}

export function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}
