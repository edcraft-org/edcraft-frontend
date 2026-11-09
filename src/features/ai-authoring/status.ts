import type { AuthoringJob, AuthoringResult, AuthoringReview } from "./types";

export type StatusVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "success"
    | "outline";

export interface StatusView {
    label: string;
    variant: StatusVariant;
    summary: string;
}

function technicalChecks(review: AuthoringReview) {
    return (review.checks ?? []).filter((check) => !check.advisory);
}

export function getReviewStatus(
    review: AuthoringReview,
    result: AuthoringResult | null,
): StatusView {
    const checks = technicalChecks(review);
    const passed = checks.filter((check) => check.status === "passed").length;
    const summary =
        checks.length > 0
            ? `${passed}/${checks.length} technical checks passed`
            : "No technical checks recorded";

    if (review.state === "failed" || result?.status === "error") {
        return { label: "Failed", variant: "destructive", summary };
    }
    if (
        result?.status === "needs_review" ||
        !review.artifact_sha256 ||
        checks.length === 0 ||
        checks.some((check) => check.status !== "passed")
    ) {
        return { label: "Needs review", variant: "default", summary };
    }
    if (review.state === "completed") {
        return { label: "Ready for review", variant: "success", summary };
    }
    return { label: "Checking", variant: "default", summary };
}

export function getJobStatus(job: AuthoringJob): StatusView {
    if (job.state === "failed") {
        return { label: "Failed", variant: "destructive", summary: "Question creation stopped" };
    }
    if (job.state === "queued") {
        return { label: "Waiting", variant: "default", summary: "Waiting for a free authoring slot" };
    }
    if (job.state === "running") {
        switch (job.progress?.phase) {
            case "generating":
                return { label: "Writing", variant: "default", summary: "Writing the question" };
            case "checking":
                return { label: "Checking", variant: "default", summary: "Running technical checks" };
            case "correcting":
                return { label: "Correcting", variant: "default", summary: "Improving the question" };
            case "finalizing":
                return { label: "Finishing", variant: "default", summary: "Finishing the question" };
            default:
                return { label: "Creating", variant: "default", summary: "Creating the question" };
        }
    }
    if (job.result?.status === "needs_review") {
        return { label: "Needs review", variant: "default", summary: "Technical checks need attention" };
    }
    if (job.result?.status === "error") {
        return { label: "Failed", variant: "destructive", summary: "Question creation stopped" };
    }
    if (job.result?.status === "checked") {
        return { label: "Checked", variant: "success", summary: "Ready for evidence review" };
    }
    return { label: "Completed", variant: "success", summary: "Question creation finished" };
}
