import { describe, expect, it } from "vitest";
import { getApprovalBlockers, isApproved } from "../getApprovalBlockers";
import { approvedReview, technicalFailureReview, unapprovedReview } from "./fixtures";

describe("getApprovalBlockers", () => {
    it("ignores failed advisory checks when technical checks pass", () => {
        expect(getApprovalBlockers(unapprovedReview)).toEqual([]);
        expect((unapprovedReview.checks ?? []).some(
            (check) => check.advisory && check.status === "failed",
        )).toBe(true);
        expect((unapprovedReview.checks ?? []).some(
            (check) => !check.advisory && check.status === "passed",
        )).toBe(true);
    });

    it("blocks approval when a technical check fails", () => {
        const blockers = getApprovalBlockers(technicalFailureReview);
        expect(blockers).toContain(
            'The technical check "Answers and wrong choices" needs attention. Create a new question and try again.',
        );
    });

    it("blocks approval without a checked artifact", () => {
        const blockers = getApprovalBlockers({
            ...unapprovedReview,
            artifact_id: null,
            artifact_sha256: null,
        });
        expect(blockers).toContain("The question has no checked version to approve yet.");
    });

    it("describes a failed review as stopped instead of still checking", () => {
        expect(
            getApprovalBlockers({
                ...unapprovedReview,
                state: "failed",
                artifact_id: null,
                artifact_sha256: null,
                checks: [],
            }),
        ).toEqual(["Question creation stopped. Create a new question and try again."]);
    });

    it("requires an approval bound to the current artifact digest", () => {
        expect(isApproved(approvedReview)).toBe(true);
        expect(isApproved(unapprovedReview)).toBe(false);
        expect(
            isApproved({
                ...approvedReview,
                artifact_sha256: "b".repeat(64),
            }),
        ).toBe(false);
    });
});
