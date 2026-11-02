import type { AuthoringCheck, AuthoringReview } from "./types";

export function checkLabel(check: AuthoringCheck): string {
    return check.tool.replaceAll("_", " ");
}

export function statusLabel(status: AuthoringCheck["status"]): string {
    switch (status) {
        case "passed":
            return "Passed";
        case "failed":
            return "Failed";
        case "skipped":
            return "Skipped";
        case "error":
            return "Unavailable";
    }
}

/**
 * Technical checks gate approval. Difficulty, relevance and every advisory
 * finding are review information only and must never block an approval.
 */
export function getApprovalBlockers(review: AuthoringReview | null | undefined): string[] {
    if (!review) return ["Review evidence has not loaded."];

    const blockers: string[] = [];
    if (review.state !== "completed") {
        blockers.push("The authoring job has not completed.");
    }
    if (!review.artifact_id || !review.artifact_sha256) {
        blockers.push("No checked artifact is available for approval.");
    }

    const technicalChecks = (review.checks ?? []).filter((check) => !check.advisory);
    if (technicalChecks.length === 0) {
        blockers.push("No technical check evidence is available.");
    }
    for (const check of technicalChecks) {
        if (check.status !== "passed") {
            blockers.push(`Technical check "${checkLabel(check)}" did not pass.`);
        }
    }

    return blockers;
}

export function isApproved(review: AuthoringReview | null | undefined): boolean {
    return Boolean(
        review?.artifact_sha256 &&
            review.approval?.decision === "approved" &&
            review.approval.artifact_sha256 === review.artifact_sha256,
    );
}
