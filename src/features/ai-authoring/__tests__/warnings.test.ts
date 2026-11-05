import { describe, expect, it } from "vitest";
import { filterActionableWarnings } from "../warnings";

describe("filterActionableWarnings", () => {
    it("drops mismatch-only warnings once approved", () => {
        const warnings = [
            "DIFFICULTY_MISMATCH",
            "difficulty_mismatch_low_confidence",
            "RELEVANCE_MISMATCH",
            "DIFFICULTY_MISMATCH: estimated harder than requested",
            "RELEVANCE_MISMATCH requested topic not found",
        ];

        expect(filterActionableWarnings(warnings, { approved: true })).toEqual([]);
    });

    it("keeps generation warnings even when they mention a mismatch code", () => {
        const warnings = [
            "Duplicate warning for RELEVANCE_MISMATCH",
            "Seed 7 did not produce a usable question",
            "DIFFICULTY_MISMATCH_SEED",
        ];

        expect(filterActionableWarnings(warnings, { approved: true })).toEqual(warnings);
    });

    it("keeps duplicate and seed warnings that are separate from mismatches", () => {
        const duplicates = [
            "Finite parameter domain produced 1 duplicate.",
            "Finite parameter domain produced 1 duplicate.",
            "SEED_REUSED",
        ];

        expect(filterActionableWarnings(duplicates, { approved: true })).toEqual(duplicates);
    });

    it("keeps every warning when the review is not approved", () => {
        const warnings = [
            "DIFFICULTY_MISMATCH",
            "RELEVANCE_MISMATCH",
            "Estimated difficulty is harder: DIFFICULTY_MISMATCH",
            "Finite parameter domain produced 1 duplicate.",
        ];

        expect(filterActionableWarnings(warnings, { approved: false })).toEqual(warnings);
    });

    it("handles missing warnings", () => {
        expect(filterActionableWarnings(null, { approved: true })).toEqual([]);
        expect(filterActionableWarnings(undefined, { approved: false })).toEqual([]);
    });
});
