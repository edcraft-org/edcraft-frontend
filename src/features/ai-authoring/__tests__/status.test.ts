import { describe, expect, it } from "vitest";
import { getJobStatus, getReviewStatus } from "../status";
import type { AuthoringJob } from "../types";
import { approvedReview, completedJob, technicalFailureReview } from "./fixtures";

describe("AI authoring status", () => {
    it("labels a completed review with passing technical checks as Checked", () => {
        expect(getReviewStatus(approvedReview, null)).toMatchObject({
            label: "Checked",
            summary: "1/1 technical checks passed",
        });
    });

    it("labels a failed technical check as Needs review", () => {
        expect(getReviewStatus(technicalFailureReview, null).label).toBe("Needs review");
    });

    it("labels a failed review as Failed", () => {
        expect(getReviewStatus({ ...approvedReview, state: "failed" }, null).label).toBe("Failed");
    });

    it("labels a completed checked job as Checked", () => {
        expect(getJobStatus(completedJob)).toMatchObject({
            label: "Checked",
            summary: "Ready for evidence review",
        });
    });

    it("labels a job that needs review", () => {
        const job: AuthoringJob = {
            ...completedJob,
            result: completedJob.result
                ? { ...completedJob.result, status: "needs_review" }
                : null,
        };
        expect(getJobStatus(job).label).toBe("Needs review");
    });

    it("reports the active generation phase", () => {
        const job: AuthoringJob = {
            ...completedJob,
            state: "running",
            result: null,
            progress: { phase: "generating", attempt: 1 },
        };
        expect(getJobStatus(job).label).toBe("Writing");
    });
});
