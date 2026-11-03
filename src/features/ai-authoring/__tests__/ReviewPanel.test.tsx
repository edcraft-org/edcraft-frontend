import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@/api/axiosInstance";
import { ReviewPanel } from "../components/ReviewPanel";
import {
    decideAuthoringApproval,
    getAuthoringPreview,
} from "../services/ai-authoring.service";
import type { AuthoringApproval, AuthoringReview } from "../types";
import {
    approvedReview,
    preview,
    technicalFailureReview,
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
    PreviewQuestion: ({ instance }: { instance: { question: { question: string } } }) => (
        <div>{instance.question.question}</div>
    ),
}));

const approval: AuthoringApproval = {
    decision: "approved",
    artifact_sha256: "a".repeat(64),
    reviewer: "teacher@example.com",
    note: null,
    decided_at: "2026-11-03T00:00:00Z",
};

function renderPanel(review: AuthoringReview, onStaleArtifact = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <ReviewPanel
                    jobId="job-1"
                    review={review}
                    result={null}
                    onStaleArtifact={onStaleArtifact}
                />
            </MemoryRouter>
        </QueryClientProvider>,
    );
    return { onStaleArtifact };
}

describe("ReviewPanel", () => {
    beforeEach(() => {
        vi.mocked(getAuthoringPreview).mockResolvedValue(preview);
        vi.mocked(decideAuthoringApproval).mockResolvedValue(approval);
    });

    afterEach(cleanup);

    it("allows approval when only advisory checks fail", async () => {
        renderPanel(unapprovedReview);

        expect(await screen.findByText(previewInstanceQuestion())).toBeInTheDocument();
        expect(screen.getByText(/Estimated difficulty:/)).toHaveTextContent(/hard/i);
        expect(screen.getByText(/never block approval/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve artifact" })).toBeEnabled();
    });

    it("blocks approval and explains why when a technical check fails", async () => {
        renderPanel(technicalFailureReview);

        expect(
            await screen.findByText('Technical check "sample execution" did not pass.'),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve artifact" })).toBeDisabled();
    });

    it("sends the exact artifact digest and optional note", async () => {
        const user = userEvent.setup();
        renderPanel(unapprovedReview);

        await user.type(screen.getByLabelText(/review note/i), "  Looks good  ");
        await user.click(screen.getByRole("button", { name: "Approve artifact" }));

        await waitFor(() => {
            expect(decideAuthoringApproval).toHaveBeenCalledWith("job-1", {
                artifact_sha256: unapprovedReview.artifact_sha256,
                decision: "approved",
                note: "Looks good",
            });
        });
    });

    it("reports a stale digest and asks the page to refresh", async () => {
        vi.mocked(decideAuthoringApproval).mockRejectedValue(
            new ApiError(409, "The artifact digest is stale."),
        );
        const user = userEvent.setup();
        const { onStaleArtifact } = renderPanel(approvedReview);

        await user.click(screen.getByRole("button", { name: "Re-approve this artifact" }));

        await waitFor(() => expect(onStaleArtifact).toHaveBeenCalledOnce());
        expect(await screen.findByText(/artifact changed or is no longer usable/i)).toBeInTheDocument();
    });

    it("renders a FastAPI 422 detail array as a readable message without crashing", async () => {
        const error = new ApiError(422, "Unprocessable Entity");
        Object.defineProperty(error, "detail", {
            value: [
                {
                    loc: ["body", "seed"],
                    msg: "Input should be greater than or equal to 0",
                },
            ],
        });
        vi.mocked(getAuthoringPreview).mockRejectedValue(error);

        renderPanel(approvedReview);

        expect(
            await screen.findByText(
                /body.seed: Input should be greater than or equal to 0/,
                undefined,
                { timeout: 5000 },
            ),
        ).toBeInTheDocument();
        expect(screen.getByText("Review checked artifact")).toBeInTheDocument();
    });

    it("rejects an out-of-range preview seed inline without sending a request", async () => {
        const user = userEvent.setup();
        renderPanel(approvedReview);
        await screen.findByText(previewInstanceQuestion());
        const callsBefore = vi.mocked(getAuthoringPreview).mock.calls.length;

        const seedInput = screen.getByLabelText("Preview seed");
        await user.clear(seedInput);
        await user.type(seedInput, "2147483648");
        await user.click(screen.getByRole("button", { name: "Load preview" }));

        expect(screen.getByText(/Enter a seed from 0 to 2147483647/)).toBeInTheDocument();
        expect(vi.mocked(getAuthoringPreview).mock.calls.length).toBe(callsBefore);
        expect(screen.getByText("Review checked artifact")).toBeInTheDocument();
    });

    it("shows the actual relevance verdict and advisory score", async () => {
        renderPanel({
            ...approvedReview,
            relevance: {
                advisory: true,
                status: "assessed",
                unavailable: false,
                score: 0.42,
                threshold: 0.5,
                relevant: false,
                reason: "Off topic.",
                error_code: null,
            },
        });

        expect(await screen.findByText("Not relevant")).toBeInTheDocument();
        expect(
            screen.getByText(/Advisory score 0.42 \(threshold 0.50\)/),
        ).toBeInTheDocument();
        expect(screen.getAllByText(/not a probability that an answer is correct/).length).toBeGreaterThan(
            0,
        );
    });

    it("shows advisory difficulty confidence and its source", async () => {
        renderPanel({
            ...approvedReview,
            difficulty: {
                ...approvedReview.difficulty!,
                confidence: 0.72,
                confidence_source: "self_reported",
            },
        });

        expect(
            await screen.findByText(/Advisory estimate confidence 0.72 \(self reported\)/),
        ).toBeInTheDocument();
    });

    it("labels a historical candidate when attempts are visible", async () => {
        renderPanel({ ...approvedReview, candidate_is_historical_attempt: true });

        expect(
            await screen.findByText(/historical attempt, not the selected checked artifact/),
        ).toBeInTheDocument();
    });
});

function previewInstanceQuestion(): string {
    return preview.question.question.question;
}
