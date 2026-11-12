import { describe, expect, it } from "vitest";
import { filterMismatchWarnings, warningText } from "../warnings";

describe("filterMismatchWarnings", () => {
    it("drops mismatch-only warnings", () => {
        const warnings = [
            "DIFFICULTY_MISMATCH",
            "difficulty_mismatch_low_confidence",
            "RELEVANCE_MISMATCH",
            "DIFFICULTY_MISMATCH: estimated harder than requested",
            "RELEVANCE_MISMATCH requested topic not found",
        ];

        expect(filterMismatchWarnings(warnings)).toEqual([]);
    });

    it("keeps generation warnings even when they mention a mismatch code", () => {
        const warnings = [
            "Duplicate warning for RELEVANCE_MISMATCH",
            "Seed 7 did not produce a usable question",
            "DIFFICULTY_MISMATCH_SEED",
        ];

        expect(filterMismatchWarnings(warnings)).toEqual(warnings);
    });

    it("keeps duplicate and seed warnings that are separate from mismatches", () => {
        const duplicates = [
            "Finite parameter domain produced 1 duplicate.",
            "Finite parameter domain produced 1 duplicate.",
            "SEED_REUSED",
        ];

        expect(filterMismatchWarnings(duplicates)).toEqual(duplicates);
    });

    it("handles missing warnings", () => {
        expect(filterMismatchWarnings(null)).toEqual([]);
        expect(filterMismatchWarnings(undefined)).toEqual([]);
    });
});

describe("warningText", () => {
    it("turns known review warning codes into readable text", () => {
        expect(warningText("JUDGE_TRANSPORT")).toContain("could not be reached");
        expect(warningText("judge_transport")).toContain("could not be reached");
    });

    it("leaves generation prose unchanged", () => {
        const warning = "Finite parameter domain produced 1 duplicate.";
        expect(warningText(warning)).toBe(warning);
    });
});
