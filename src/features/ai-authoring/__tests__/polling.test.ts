import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/axiosInstance";
import { nextJobPollingInterval } from "../polling";

describe("nextJobPollingInterval", () => {
    it("keeps polling active jobs through transient failures", () => {
        expect(nextJobPollingInterval("queued", new ApiError(500, "temporary"))).toBe(2000);
        expect(nextJobPollingInterval("running", new Error("network"))).toBe(2000);
    });

    it("stops on auth and not-found errors instead of polling forever", () => {
        expect(nextJobPollingInterval("running", new ApiError(401, "expired"))).toBe(false);
        expect(nextJobPollingInterval("running", new ApiError(404, "gone"))).toBe(false);
    });

    it("stops once the last known job state is terminal or absent", () => {
        expect(nextJobPollingInterval("completed", undefined)).toBe(false);
        expect(nextJobPollingInterval(undefined, new Error("initial request failed"))).toBe(false);
    });
});
