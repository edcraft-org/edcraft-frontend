import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GeneratePanel } from "../components/GeneratePanel";
import { generateAuthoringBatch } from "../services/ai-authoring.service";
import { approvedReview, batch, unapprovedReview } from "./fixtures";

vi.mock("../services/ai-authoring.service", () => ({
    getAuthoringCapabilities: vi.fn(),
    createAuthoringJob: vi.fn(),
    listAuthoringJobs: vi.fn(),
    getAuthoringJob: vi.fn(),
    getAuthoringReview: vi.fn(),
    getAuthoringPreview: vi.fn(),
    decideAuthoringApproval: vi.fn(),
    generateAuthoringBatch: vi.fn(),
}));

vi.mock("../components/PreviewQuestion", () => ({
    PreviewQuestion: ({ instance }: { instance: { seed: number } }) => (
        <div>Preview for seed {instance.seed}</div>
    ),
}));

function renderPanel(review = approvedReview, onStaleArtifact = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <GeneratePanel
                    jobId="job-1"
                    review={review}
                    maxQuantity={50}
                    onStaleArtifact={onStaleArtifact}
                />
            </MemoryRouter>
        </QueryClientProvider>,
    );
    return { onStaleArtifact };
}

describe("GeneratePanel", () => {
    beforeEach(() => {
        vi.mocked(generateAuthoringBatch).mockResolvedValue(batch);
    });

    afterEach(cleanup);

    it("keeps generation disabled until the exact artifact is approved", () => {
        renderPanel(unapprovedReview);

        expect(screen.getByText(/Generation is locked/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Generate batch" })).toBeDisabled();
    });

    it("sends the approved digest, deterministic seed and quantity unchanged", async () => {
        const user = userEvent.setup();
        renderPanel();

        const quantity = screen.getByLabelText("Quantity");
        const seed = screen.getByLabelText("Base seed");
        await user.clear(quantity);
        await user.type(quantity, "3");
        await user.clear(seed);
        await user.type(seed, "7");

        await user.click(screen.getByRole("button", { name: "Generate batch" }));

        await waitFor(() => {
            expect(generateAuthoringBatch).toHaveBeenCalledWith("job-1", {
                artifact_sha256: approvedReview.artifact_sha256,
                seed: 7,
                quantity: 3,
            });
        });
        expect(await screen.findByText(/Requested 3 · actual 3 · distinct 2 · duplicates 1/))
            .toBeInTheDocument();
        expect(screen.getByText(/Finite parameter domain produced 1 duplicate/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Download JSON/ })).toBeEnabled();
    });

    it("reports a stale approval and asks the page to refresh", async () => {
        const { ApiError } = await import("@/api/axiosInstance");
        vi.mocked(generateAuthoringBatch).mockRejectedValue(
            new ApiError(409, "The artifact changed."),
        );
        const user = userEvent.setup();
        const { onStaleArtifact } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Generate batch" }));

        await waitFor(() => expect(onStaleArtifact).toHaveBeenCalledOnce());
        expect(await screen.findByText(/artifact changed or is no longer usable/i)).toBeInTheDocument();
    });
});
