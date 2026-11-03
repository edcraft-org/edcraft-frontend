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
            'The technical check "Sample examples" failed. Fix the code or create a new question before approving.',
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
