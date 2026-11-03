import { afterEach, describe, expect, it, vi } from "vitest";
import { batchFileName, downloadAuthoringBatch } from "../download";
import { batch } from "./fixtures";

describe("downloadAuthoringBatch", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("downloads the canonical batch JSON with a deterministic filename", async () => {
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
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:authoring-batch");
        expect(batchFileName(batch)).toBe("ai-authoring-job-1-seed-7.json");

        const [blob] = createObjectURL.mock.calls[0];
        expect(blob).toBeInstanceOf(Blob);
        if (!(blob instanceof Blob)) throw new Error("expected a Blob");
        await expect(blob.text()).resolves.toBe(JSON.stringify(batch, null, 2));
    });
});
