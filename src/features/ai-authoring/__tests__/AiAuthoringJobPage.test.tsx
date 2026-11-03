import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/axiosInstance";
import AiAuthoringJobPage from "../pages/AiAuthoringJobPage";
import {
    createAuthoringJob,
    decideAuthoringApproval,
    generateAuthoringBatch,
    getAuthoringCapabilities,
    getAuthoringJob,
    getAuthoringPreview,
    getAuthoringReview,
} from "../services/ai-authoring.service";
import {
    approvedReview,
    batch,
    capabilities,
    completedJob,
    preview,
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

vi.mock("../components/ReadOnlyCode", () => ({
    ReadOnlyCode: ({ code, label }: { code: string; label: string }) => (
        <pre aria-label={label}>{code}</pre>
    ),
}));

vi.mock("../components/PreviewQuestion", () => ({
    PreviewQuestion: ({ instance }: { instance: { seed: number } }) => (
        <div>Preview for seed {instance.seed}</div>
    ),
}));

function OpenJob2Button() {
    const navigate = useNavigate();
    return (
        <button type="button" onClick={() => navigate("/ai-authoring/job-2")}>
            Open job 2
        </button>
    );
}

function renderJobPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/ai-authoring/job-1"]}>
                <OpenJob2Button />
                <Routes>
                    <Route path="/ai-authoring/:jobId" element={<AiAuthoringJobPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("AiAuthoringJobPage", () => {
    beforeEach(() => {
        vi.mocked(getAuthoringJob).mockResolvedValue(completedJob);
        vi.mocked(getAuthoringReview).mockResolvedValue(approvedReview);
        vi.mocked(getAuthoringCapabilities).mockResolvedValue(capabilities);
        vi.mocked(getAuthoringPreview).mockResolvedValue(preview);
        vi.mocked(generateAuthoringBatch).mockResolvedValue(batch);
        vi.mocked(decideAuthoringApproval).mockResolvedValue({
            decision: "approved",
            artifact_sha256: "a".repeat(64),
            reviewer: "teacher@example.com",
            note: null,
            decided_at: "2026-11-03T00:00:00Z",
        });
    });

    afterEach(cleanup);

    it("resumes the job from the URL without creating another job", async () => {
        renderJobPage();

        expect(await screen.findByText("Ready to review")).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: "Technical checks" })).toBeInTheDocument();
        expect(getAuthoringJob).toHaveBeenCalledWith("job-1");
        expect(getAuthoringReview).toHaveBeenCalledWith("job-1");
        expect(createAuthoringJob).not.toHaveBeenCalled();
        expect(screen.getByText("/ai-authoring/job-1")).toBeInTheDocument();
    });

    it("refetches review and clears generated output after a stale 409", async () => {
        vi.mocked(generateAuthoringBatch)
            .mockResolvedValueOnce(batch)
            .mockRejectedValueOnce(new ApiError(409, "The artifact changed."));
        const user = userEvent.setup();
        renderJobPage();

        await screen.findByRole("heading", { name: "Technical checks" });
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

    it("hides cached review actions and batch when the review refresh fails", async () => {
        const user = userEvent.setup();
        renderJobPage();

        await screen.findByRole("heading", { name: "Technical checks" });
        await user.click(screen.getByRole("button", { name: "Create questions" }));
        expect(await screen.findByText(/3 created, 2 different, 1 repeated/)).toBeInTheDocument();

        vi.mocked(getAuthoringReview).mockRejectedValue(new ApiError(503, "Review unavailable."));
        vi.mocked(decideAuthoringApproval).mockRejectedValue(
            new ApiError(409, "The artifact digest is stale."),
        );

        await user.click(screen.getByRole("button", { name: "Approve this version again" }));

        expect(await screen.findByText("The question changed")).toBeInTheDocument();
        expect(await screen.findByText("Review could not be loaded")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Approve this version again" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Preview for seed 0")).not.toBeInTheDocument();
        expect(screen.queryByText(/3 created, 2 different/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Download questions (JSON)" }),
        ).not.toBeInTheDocument();
    });

    it("does not carry a stale notice to a different job route", async () => {
        vi.mocked(decideAuthoringApproval).mockRejectedValue(
            new ApiError(409, "The artifact digest is stale."),
        );
        const user = userEvent.setup();
        renderJobPage();

        await screen.findByRole("button", { name: "Approve this version again" });
        await user.click(screen.getByRole("button", { name: "Approve this version again" }));
        expect(await screen.findByText("The question changed")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Open job 2" }));

        expect(getAuthoringJob).toHaveBeenCalledWith("job-2");
        await waitFor(() =>
            expect(screen.queryByText("The question changed")).not.toBeInTheDocument(),
        );
    });
});
