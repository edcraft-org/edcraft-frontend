const MISMATCH_CODES = [
    "DIFFICULTY_MISMATCH_LOW_CONFIDENCE",
    "DIFFICULTY_MISMATCH",
    "RELEVANCE_MISMATCH",
];

const GENERATION_WARNING_TERMS = ["DUPLICATE", "SEED"];

function isMismatchOnly(normalized: string): boolean {
    return MISMATCH_CODES.some(
        (code) =>
            normalized === code ||
            normalized.startsWith(`${code}:`) ||
            normalized.startsWith(`${code} `),
    );
}

/**
 * Warnings that only restate an advisory mismatch are noise once the exact
 * artifact has been approved. A warning that also mentions a duplicate or a
 * seed describes generation output and must always stay visible.
 */
export function filterActionableWarnings(
    warnings: string[] | null | undefined,
    { approved }: { approved: boolean },
): string[] {
    const list = warnings ?? [];
    if (!approved) return [...list];

    return list.filter((warning) => {
        const normalized = warning.trim().toUpperCase();
        if (GENERATION_WARNING_TERMS.some((term) => normalized.includes(term))) {
            return true;
        }
        return !isMismatchOnly(normalized);
    });
}
