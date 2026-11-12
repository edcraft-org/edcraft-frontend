import { describe, expect, it } from "vitest";
import { getJobStatus, getReviewStatus } from "../status";
import type { AuthoringJob } from "../types";
import { approvedReview, completedJob, technicalFailureReview } from "./fixtures";

describe("AI authoring status", () => {
    it("labels a completed review with passing technical checks as ready for review", () => {
        expect(getReviewStatus(approvedReview, null)).toMatchObject({
            label: "Ready for review",
            variant: "success",
            summary: "1/1 technical checks passed",
        });
    });

    it("labels a failed technical check as Needs review in a neutral color", () => {
        expect(getReviewStatus(technicalFailureReview, null)).toMatchObject({
            label: "Needs review",
            variant: "default",
        });
    });

    it("labels a failed review as Failed in red", () => {
        expect(getReviewStatus({ ...approvedReview, state: "failed" }, null)).toMatchObject({
            label: "Failed",
            variant: "destructive",
        });
    });

    it("labels a completed checked job as Checked in green", () => {
        expect(getJobStatus(completedJob)).toMatchObject({
            label: "Checked",
            variant: "success",
            summary: "Ready for evidence review",
        });
    });

    it("labels a job that needs review in a neutral color", () => {
        const job: AuthoringJob = {
            ...completedJob,
            result: completedJob.result
                ? { ...completedJob.result, status: "needs_review" }
                : null,
        };
        expect(getJobStatus(job)).toMatchObject({
            label: "Needs review",
            variant: "default",
        });
    });

    it("reports the active generation phase", () => {
        const job: AuthoringJob = {
            ...completedJob,
            state: "running",
            result: null,
            progress: { phase: "generating", attempt: 1 },
        };
        expect(getJobStatus(job)).toMatchObject({
            label: "Writing",
            variant: "default",
        });
    });

    it("labels a failed job in red", () => {
        expect(getJobStatus({ ...completedJob, state: "failed" })).toMatchObject({
            label: "Failed",
            variant: "destructive",
        });
    });
});
