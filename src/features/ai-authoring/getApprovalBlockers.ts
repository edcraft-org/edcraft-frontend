import type { AuthoringCheck, AuthoringReview } from "./types";

const FRIENDLY_CHECK_LABELS: Record<string, string> = {
    python_syntax: "Code syntax",
    sample_execution: "Sample examples",
    template_validation: "Question template",
    parameter_validation: "Question variations",
    answer_validation: "Correct answer",
    distractor_validation: "Wrong choices",
    question_validation: "Question wording",
    difficulty_assessment: "Difficulty estimate",
    relevance_assessment: "Relevance",
};

export function friendlyCheckLabel(tool: string): string {
    const known = FRIENDLY_CHECK_LABELS[tool];
    if (known) return known;
    return tool.replaceAll("_", " ");
}

export function checkLabel(check: AuthoringCheck): string {
    return friendlyCheckLabel(check.tool);
}

export function statusLabel(status: AuthoringCheck["status"]): string {
    switch (status) {
        case "passed":
            return "Passed";
        case "failed":
            return "Needs attention";
        case "skipped":
            return "Not run";
        case "error":
            return "Could not run";
    }
}

/**
 * Technical checks gate approval. Difficulty, relevance and every advisory
 * finding are review information only and must never block an approval.
 */
export function getApprovalBlockers(review: AuthoringReview | null | undefined): string[] {
    if (!review) return ["The review has not loaded."];

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
                `The technical check "${label}" could not run. Refresh the review or create a new question before approving.`,
            );
        } else if (check.status === "skipped") {
            blockers.push(
                `The technical check "${label}" was not run. It must run before this question can be approved.`,
            );
        } else {
            blockers.push(
                `The technical check "${label}" failed. Fix the code or create a new question before approving.`,
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
