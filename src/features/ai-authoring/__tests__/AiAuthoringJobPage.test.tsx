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
    getAuthoringCapabilities,
    getAuthoringJob,
    getAuthoringPreview,
    getAuthoringReview,
} from "../services/ai-authoring.service";
import {
    approvedReview,
    capabilities,
    completedJob,
    failedJob,
    failedReview,
    needsReviewJob,
    needsReviewReview,
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

        expect(await screen.findByText("Ready for evidence review")).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: "Technical checks" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Reuse and generate" })).toBeInTheDocument();
        expect(getAuthoringJob).toHaveBeenCalledWith("job-1");
        expect(getAuthoringReview).toHaveBeenCalledWith("job-1");
        expect(createAuthoringJob).not.toHaveBeenCalled();
        expect(screen.getByText("/ai-authoring/job-1")).toBeInTheDocument();
    });

    it("offers retry with the original request after a failure", async () => {
        vi.mocked(getAuthoringJob).mockResolvedValue(failedJob);
        vi.mocked(getAuthoringReview).mockResolvedValue(failedReview);
        vi.mocked(createAuthoringJob).mockResolvedValue({
            job_id: "job-2",
            status_url: "/ai-authoring/jobs/job-2",
        });
        const user = userEvent.setup();
        renderJobPage();

        expect(await screen.findByText("Question creation failed")).toBeInTheDocument();
        expect(await screen.findByText("Retry request")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: failedReview.request.prompt,
                difficulty: failedReview.request.difficulty,
                num_distractors: failedReview.request.num_distractors,
                model_profile: "default",
            });
        });
    });

    it("offers retry when a completed job still needs review", async () => {
        vi.mocked(getAuthoringJob).mockResolvedValue(needsReviewJob);
        vi.mocked(getAuthoringReview).mockResolvedValue(needsReviewReview);
        vi.mocked(createAuthoringJob).mockResolvedValue({
            job_id: "job-2",
            status_url: "/ai-authoring/jobs/job-2",
        });
        const user = userEvent.setup();
        renderJobPage();

        expect(await screen.findByText("Technical checks did not pass")).toBeInTheDocument();
        expect(screen.getAllByText("Needs review").length).toBeGreaterThan(0);
        expect(await screen.findByText("Retry request")).toBeInTheDocument();
        expect(
            screen.getAllByText("The generated template failed technical checks.").length,
        ).toBeGreaterThan(0);
        expect(screen.getByText("Draft · checks failed")).toBeInTheDocument();
        expect(screen.getByText(/This draft did not pass technical checks/)).toBeInTheDocument();
        expect(screen.getByLabelText("Template code")).toHaveTextContent("def list_sum");

        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: needsReviewReview.request.prompt,
                difficulty: needsReviewReview.request.difficulty,
                num_distractors: needsReviewReview.request.num_distractors,
                model_profile: "default",
            });
        });
    });

    it("updates the retry picker when navigating between jobs", async () => {
        const alternateProfile = {
            id: "alternate",
            label: "Alternate authoring model",
            provider: "openai",
            model: "other-model",
        };
        vi.mocked(getAuthoringCapabilities).mockResolvedValue({
            ...capabilities,
            model_profiles: [...capabilities.model_profiles, alternateProfile],
        });
        vi.mocked(getAuthoringJob).mockImplementation(async (id) =>
            id === "job-1" ? failedJob : { ...failedJob, job_id: "job-2" },
        );
        vi.mocked(getAuthoringReview).mockImplementation(async (id) =>
            id === "job-1"
                ? failedReview
                : {
                      ...failedReview,
                      job_id: "job-2",
                      request: {
                          ...failedReview.request,
                          model_profile: "alternate",
                      },
                  },
        );
        const user = userEvent.setup();
        renderJobPage();

        expect(await screen.findByRole("combobox", { name: "Question model" })).toHaveTextContent(
            "Default authoring model",
        );

        await user.click(screen.getByRole("button", { name: "Open job 2" }));

        await waitFor(() =>
            expect(screen.getByRole("combobox", { name: "Question model" })).toHaveTextContent(
                "Alternate authoring model",
            ),
        );
    });

    it("hides cached review actions when the review refresh fails", async () => {
        const user = userEvent.setup();
        renderJobPage();

        await screen.findByRole("heading", { name: "Technical checks" });

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
