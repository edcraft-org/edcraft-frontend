import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "@/api/axiosInstance";
import AiAuthoringGeneratePage from "../pages/AiAuthoringGeneratePage";
import {
    generateAuthoringBatch,
    getAuthoringCapabilities,
    getAuthoringJob,
    getAuthoringReview,
} from "../services/ai-authoring.service";
import {
    approvedReview,
    batch,
    capabilities,
    completedJob,
    failedJob,
    failedReview,
    unapprovedReview,
} from "./fixtures";

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

function renderGeneratePage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/ai-authoring/job-1/generate"]}>
                <Routes>
                    <Route
                        path="/ai-authoring/:jobId/generate"
                        element={<AiAuthoringGeneratePage />}
                    />
                    <Route path="/ai-authoring/:jobId" element={<div>Review route</div>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("AiAuthoringGeneratePage", () => {
    beforeEach(() => {
        vi.mocked(getAuthoringJob).mockResolvedValue(completedJob);
        vi.mocked(getAuthoringReview).mockResolvedValue(approvedReview);
        vi.mocked(getAuthoringCapabilities).mockResolvedValue(capabilities);
        vi.mocked(generateAuthoringBatch).mockResolvedValue(batch);
    });

    afterEach(cleanup);

    it("renders generation for a completed question and links back to the review", async () => {
        renderGeneratePage();

        expect(
            await screen.findByRole("button", { name: "Create questions" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to review" })).toHaveAttribute(
            "href",
            "/ai-authoring/job-1",
        );
        expect(getAuthoringReview).toHaveBeenCalledWith("job-1");
    });

    it("shows approval guidance for an unapproved question", async () => {
        vi.mocked(getAuthoringReview).mockResolvedValue(unapprovedReview);
        renderGeneratePage();

        expect(
            await screen.findByText(/Approve this question before creating more versions/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Create questions" })).toBeDisabled();
    });

    it("refreshes the review and clears generated output after a stale 409", async () => {
        vi.mocked(generateAuthoringBatch)
            .mockResolvedValueOnce(batch)
            .mockRejectedValueOnce(new ApiError(409, "The artifact changed."));
        const user = userEvent.setup();
        renderGeneratePage();

        await screen.findByRole("button", { name: "Create questions" });
        await user.click(screen.getByRole("button", { name: "Create questions" }));
        expect(await screen.findByText(/3 created, 2 different, 1 repeated/)).toBeInTheDocument();
        const reviewCallsBefore = vi.mocked(getAuthoringReview).mock.calls.length;

        await user.click(screen.getByRole("button", { name: "Create another set" }));

        expect(await screen.findByText("The question changed")).toBeInTheDocument();
        await waitFor(() =>
            expect(vi.mocked(getAuthoringReview).mock.calls.length).toBeGreaterThan(
                reviewCallsBefore,
            ),
        );
        await waitFor(() =>
            expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument(),
        );
    });

    it("hides generated output when the review refresh fails", async () => {
        const user = userEvent.setup();
        renderGeneratePage();

        await screen.findByRole("button", { name: "Create questions" });
        await user.click(screen.getByRole("button", { name: "Create questions" }));
        expect(await screen.findByText(/3 created, 2 different/)).toBeInTheDocument();

        vi.mocked(getAuthoringReview).mockRejectedValue(new ApiError(503, "Review unavailable."));
        await user.click(screen.getByRole("button", { name: "Refresh" }));

        expect(await screen.findByText("Review could not be loaded")).toBeInTheDocument();
        expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Download questions (JSON)" }),
        ).not.toBeInTheDocument();
    });

    it("explains that only completed questions can be reused", async () => {
        vi.mocked(getAuthoringJob).mockResolvedValue(failedJob);
        vi.mocked(getAuthoringReview).mockResolvedValue(failedReview);
        renderGeneratePage();

        expect(
            await screen.findByText("This question is not ready to reuse"),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Create questions" }),
        ).not.toBeInTheDocument();
    });
});
