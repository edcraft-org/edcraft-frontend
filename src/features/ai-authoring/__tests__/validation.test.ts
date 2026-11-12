import { describe, expect, it } from "vitest";
import { MAX_SEED, seedError, seedRangeError } from "../validation";

describe("seed validation", () => {
    it("accepts the full server seed range", () => {
        expect(seedError(0)).toBeNull();
        expect(seedError(MAX_SEED)).toBeNull();
    });

    it("rejects negative, fractional and overflowing seeds", () => {
        expect(seedError(-1)).toContain("0 to 2147483647");
        expect(seedError(1.5)).toContain("0 to 2147483647");
        expect(seedError(MAX_SEED + 1)).toContain("0 to 2147483647");
    });

    it("rejects a generation range that crosses the maximum seed", () => {
        expect(seedRangeError(MAX_SEED - 4, 5)).toBeNull();
        expect(seedRangeError(MAX_SEED, 2)).toContain(
            "The last seed (2147483648) exceeds 2147483647",
        );
    });
});
