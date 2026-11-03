import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GeneratePanel } from "../components/GeneratePanel";
import { generateAuthoringBatch } from "../services/ai-authoring.service";
import type { AuthoringReview } from "../types";
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

const rejectedReview: AuthoringReview = {
    ...approvedReview,
    approval: {
        decision: "rejected",
        artifact_sha256: "a".repeat(64),
        reviewer: "teacher@example.com",
        note: null,
        decided_at: "2026-11-03T00:01:00Z",
    },
};

function renderPanel({
    review = approvedReview,
    onStaleArtifact = vi.fn(),
}: {
    review?: AuthoringReview;
    onStaleArtifact?: () => void;
} = {}) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const panel = (currentReview: AuthoringReview) => (
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <GeneratePanel
                    jobId="job-1"
                    review={currentReview}
                    maxQuantity={50}
                    lastGeneration={null}
                    onStaleArtifact={onStaleArtifact}
                />
            </MemoryRouter>
        </QueryClientProvider>
    );
    const result = render(panel(review));
    return {
        onStaleArtifact,
        rerender: (nextReview: AuthoringReview) => result.rerender(panel(nextReview)),
    };
}

describe("GeneratePanel", () => {
    beforeEach(() => {
        vi.mocked(generateAuthoringBatch).mockResolvedValue(batch);
    });

    afterEach(cleanup);

    it("keeps generation disabled until the exact artifact is approved", () => {
        renderPanel({ review: unapprovedReview });

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

    it("hides a generated batch when the same artifact is rejected", async () => {
        const user = userEvent.setup();
        const { rerender } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Generate batch" }));
        expect(await screen.findByText(/Requested 3 · actual 3/)).toBeInTheDocument();

        rerender(rejectedReview);

        expect(screen.queryByText(/Requested 3 · actual 3/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Download JSON/ })).not.toBeInTheDocument();
        expect(screen.getByText(/Generation is locked/i)).toBeInTheDocument();
    });

    it("ignores a generation that completes after the artifact is rejected", async () => {
        let resolveGeneration: (value: typeof batch) => void = () => {};
        vi.mocked(generateAuthoringBatch).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveGeneration = resolve;
                }),
        );
        const user = userEvent.setup();
        const { rerender } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Generate batch" }));
        rerender(rejectedReview);

        await act(async () => {
            resolveGeneration(batch);
        });

        expect(screen.queryByText(/Requested 3 · actual 3/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Download JSON/ })).not.toBeInTheDocument();
        expect(screen.getByText(/Generation is locked/i)).toBeInTheDocument();
    });

    it("hides a prior batch after a stale generation error", async () => {
        const { ApiError } = await import("@/api/axiosInstance");
        const user = userEvent.setup();
        const { onStaleArtifact } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Generate batch" }));
        expect(await screen.findByText(/Requested 3 · actual 3/)).toBeInTheDocument();

        vi.mocked(generateAuthoringBatch).mockRejectedValue(
            new ApiError(409, "The artifact changed."),
        );
        await user.click(screen.getByRole("button", { name: "Generate another batch" }));

        await waitFor(() => expect(onStaleArtifact).toHaveBeenCalledOnce());
        expect(screen.queryByText(/Requested 3 · actual 3/)).not.toBeInTheDocument();
        expect(await screen.findByText(/artifact changed or is no longer usable/i)).toBeInTheDocument();
    });
});
