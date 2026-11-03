import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GeneratePanel } from "../components/GeneratePanel";
import { generateAuthoringBatch } from "../services/ai-authoring.service";
import type { AuthoringReview, GenerationMetadata } from "../types";
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

const lastGeneration: GenerationMetadata = {
    base_seed: 7,
    requested_quantity: 2,
    actual_quantity: 2,
    distinct_count: 2,
    duplicates: 0,
    created_at: "2026-11-03T00:02:00Z",
    warnings: [],
    artifact_sha256: "a".repeat(64),
};

function renderPanel({
    review = approvedReview,
    onStaleArtifact = vi.fn(),
    lastGenerationMetadata = null,
}: {
    review?: AuthoringReview;
    onStaleArtifact?: () => void;
    lastGenerationMetadata?: GenerationMetadata | null;
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
                    lastGeneration={lastGenerationMetadata}
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

async function openAdvancedOptions() {
    const user = userEvent.setup();
    await user.click(screen.getByText("Advanced options"));
    return user;
}

describe("GeneratePanel", () => {
    beforeEach(() => {
        vi.mocked(generateAuthoringBatch).mockResolvedValue(batch);
    });

    afterEach(cleanup);

    it("keeps the number of questions visible and starting seed under advanced options", () => {
        renderPanel();

        expect(screen.getByLabelText("Number of questions")).toBeVisible();
        const advanced = screen.getByText("Advanced options").closest("details");
        expect(advanced).not.toHaveAttribute("open");
        expect(within(advanced as HTMLElement).getByLabelText("Starting seed")).toBeInTheDocument();
    });

    it("keeps generation disabled until the exact artifact is approved", () => {
        renderPanel({ review: unapprovedReview });

        expect(
            screen.getByText(/Approve this question before creating more versions/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Create questions" })).toBeDisabled();
    });

    it("sends the approved digest, deterministic seed and quantity unchanged", async () => {
        renderPanel();
        const user = await openAdvancedOptions();

        const quantity = screen.getByLabelText("Number of questions");
        const seed = screen.getByLabelText("Starting seed");
        await user.clear(quantity);
        await user.type(quantity, "3");
        await user.clear(seed);
        await user.type(seed, "7");

        await user.click(screen.getByRole("button", { name: "Create questions" }));

        await waitFor(() => {
            expect(generateAuthoringBatch).toHaveBeenCalledWith("job-1", {
                artifact_sha256: approvedReview.artifact_sha256,
                seed: 7,
                quantity: 3,
            });
        });
        expect(
            await screen.findByText(/3 created, 2 different, 1 repeated/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Finite parameter domain produced 1 duplicate/),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Download questions (JSON)" })).toBeEnabled();
    });

    it("hides a generated batch when the same artifact is rejected", async () => {
        const user = userEvent.setup();
        const { rerender } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Create questions" }));
        expect(await screen.findByText(/3 created, 2 different/)).toBeInTheDocument();

        rerender(rejectedReview);

        expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Download questions (JSON)" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(/Approve this question before creating more versions/i),
        ).toBeInTheDocument();
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

        await user.click(screen.getByRole("button", { name: "Create questions" }));
        rerender(rejectedReview);

        await act(async () => {
            resolveGeneration(batch);
        });

        expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Download questions (JSON)" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(/Approve this question before creating more versions/i),
        ).toBeInTheDocument();
    });

    it("hides a prior batch after a stale generation error", async () => {
        const { ApiError } = await import("@/api/axiosInstance");
        const user = userEvent.setup();
        const { onStaleArtifact } = renderPanel();

        await user.click(screen.getByRole("button", { name: "Create questions" }));
        expect(await screen.findByText(/3 created, 2 different/)).toBeInTheDocument();

        vi.mocked(generateAuthoringBatch).mockRejectedValue(
            new ApiError(409, "The artifact changed."),
        );
        await user.click(screen.getByRole("button", { name: "Create another set" }));

        await waitFor(() => expect(onStaleArtifact).toHaveBeenCalledOnce());
        expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument();
        expect(
            await screen.findByText(/changed or is no longer usable/i),
        ).toBeInTheDocument();
    });

    it("rejects an out-of-range seed inline without sending a request", async () => {
        renderPanel();
        const user = await openAdvancedOptions();

        const seed = screen.getByLabelText("Starting seed");
        await user.clear(seed);
        await user.type(seed, "2147483648");
        await user.click(screen.getByRole("button", { name: "Create questions" }));

        expect(screen.getByText(/Enter a seed from 0 to 2147483647/)).toBeInTheDocument();
        expect(generateAuthoringBatch).not.toHaveBeenCalled();
    });

    it("rejects a batch whose last seed would overflow", async () => {
        renderPanel();
        const user = await openAdvancedOptions();

        const quantity = screen.getByLabelText("Number of questions");
        const seed = screen.getByLabelText("Starting seed");
        await user.clear(quantity);
        await user.type(quantity, "5");
        await user.clear(seed);
        await user.type(seed, "2147483647");
        await user.click(screen.getByRole("button", { name: "Create questions" }));

        expect(
            screen.getByText(/The last seed \(2147483651\) exceeds 2147483647/),
        ).toBeInTheDocument();
        expect(generateAuthoringBatch).not.toHaveBeenCalled();
    });

    it("describes the persisted last set without claiming its questions are stored", () => {
        renderPanel({ lastGenerationMetadata: lastGeneration });

        expect(screen.getByText("Last created set")).toBeInTheDocument();
        expect(screen.getByText(/2 created, all different/)).toBeInTheDocument();
        expect(
            screen.getByText(/Only this summary is saved/),
        ).toBeInTheDocument();
    });
});
