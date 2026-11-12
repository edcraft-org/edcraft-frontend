import { friendlyCheckLabel } from "./checkMetadata";
import type { AuthoringReview } from "./types";

/**
 * Technical checks gate approval. Difficulty, relevance and every advisory
 * finding are review information only and must never block an approval.
 */
export function getApprovalBlockers(review: AuthoringReview | null | undefined): string[] {
    if (!review) return ["The review has not loaded."];
    if (review.state === "failed") {
        return ["Question creation stopped. Create a new question and try again."];
    }

    const blockers: string[] = [];
    if (review.state !== "completed") {
        blockers.push("The question is still being checked. Wait for it to finish before approving.");
    }
    if (!review.artifact_id || !review.artifact_sha256) {
        blockers.push("The question has no checked version to approve yet.");
    }

    const technicalChecks = (review.checks ?? []).filter((check) => !check.advisory);
    if (technicalChecks.length === 0) {
        blockers.push("No technical checks were recorded, so this question cannot be approved.");
    }
    for (const check of technicalChecks) {
        if (check.status === "passed") continue;
        const label = friendlyCheckLabel(check.tool);
        if (check.status === "error") {
            blockers.push(
                `The technical check "${label}" could not run. Create a new question and try again.`,
            );
        } else if (check.status === "skipped") {
            blockers.push(
                `The technical check "${label}" was not run. Create a new question so it can be checked.`,
            );
        } else {
            blockers.push(
                `The technical check "${label}" needs attention. Create a new question and try again.`,
            );
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
