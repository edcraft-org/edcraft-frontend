import { afterEach, describe, expect, it, vi } from "vitest";
import { batchFileName, downloadAuthoringBatch } from "../download";
import { batch } from "./fixtures";

describe("downloadAuthoringBatch", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("downloads the canonical batch JSON with a deterministic filename", async () => {
        vi.useFakeTimers();
        const createObjectURL = vi.fn((_blob: Blob) => "blob:authoring-batch");
        const revokeObjectURL = vi.fn((_url: string) => undefined);
        vi.stubGlobal("URL", {
            ...URL,
            createObjectURL,
            revokeObjectURL,
        });
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        downloadAuthoringBatch(batch);

        expect(click).toHaveBeenCalledOnce();
        expect(createObjectURL).toHaveBeenCalledOnce();
        expect(revokeObjectURL).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:authoring-batch");
        expect(batchFileName(batch)).toBe("ai-authoring-job-1-seed-7.json");

        const [blob] = createObjectURL.mock.calls[0];
        expect(blob).toBeInstanceOf(Blob);
        if (!(blob instanceof Blob)) throw new Error("expected a Blob");
        const content = await blob.text();
        expect(content).toBe(JSON.stringify(batch, null, 2));
        expect(JSON.parse(content)).toMatchObject({
            job_id: "job-1",
            base_seed: 7,
            requested_quantity: 3,
            actual_quantity: 3,
            distinct_count: 2,
            duplicates: 1,
        });
    });
});
