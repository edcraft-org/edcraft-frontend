import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

vi.mock("../components/ReadOnlyCode", () => ({
    ReadOnlyCode: ({ code, label }: { code: string; label: string }) => (
        <pre aria-label={label}>{code}</pre>
    ),
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

async function openTechnicalDetails() {
    const summary = await screen.findByText("Technical details");
    const details = summary.closest("details");
    expect(details).not.toBeNull();
    if (!details) throw new Error("Technical details disclosure was not rendered.");
    expect(details).not.toHaveAttribute("open");
    await userEvent.setup().click(summary);
    return details;
}

describe("ReviewPanel", () => {
    beforeEach(() => {
        vi.mocked(getAuthoringPreview).mockResolvedValue(preview);
        vi.mocked(decideAuthoringApproval).mockResolvedValue(approval);
    });

    afterEach(cleanup);

    it("allows approval when advisory feedback differs and keeps it amber", async () => {
        renderPanel(unapprovedReview);

        expect(await screen.findByText(previewInstanceQuestion())).toBeInTheDocument();
        expect(screen.getByText("Variation 1. Each variation shows the same checked question with different generated values.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Show another variation" })).toBeEnabled();
        expect(screen.getByText("4 choices")).toBeInTheDocument();
        expect(screen.getByText("Difficulty differs")).toBeInTheDocument();
        expect(screen.getByText("Relevance was not checked")).toBeInTheDocument();
        expect(screen.getAllByText(/does not block approval/i).length).toBeGreaterThan(0);

        const advisory = screen.getByText("Difficulty differs").closest("[data-advisory]");
        expect(advisory).toHaveClass("border-amber-500/40");
        expect(screen.getByRole("button", { name: "Approve question" })).toBeEnabled();
    });

    it("keeps raw identifiers inside a closed technical disclosure", async () => {
        renderPanel(unapprovedReview);

        const summary = await screen.findByText("Technical details");
        const details = summary.closest("details");
        expect(details).not.toHaveAttribute("open");
        expect(
            within(details as HTMLElement).getAllByText(unapprovedReview.artifact_sha256!).length,
        ).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: "Approve question" })).toBeEnabled();
    });

    it("blocks approval and explains why when a technical check fails", async () => {
        renderPanel(technicalFailureReview);

        expect(
            await screen.findByText(
                /The technical check "Sample examples" failed.*create a new question/i,
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve question" })).toBeDisabled();
    });

    it("sends the exact artifact digest and optional note", async () => {
        const user = userEvent.setup();
        renderPanel(unapprovedReview);

        await user.type(screen.getByLabelText(/review note/i), "  Looks good  ");
        await user.click(screen.getByRole("button", { name: "Approve question" }));

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

        await user.click(screen.getByRole("button", { name: "Approve this version again" }));

        await waitFor(() => expect(onStaleArtifact).toHaveBeenCalledOnce());
        expect(
            await screen.findByText(/changed or is no longer usable/i),
        ).toBeInTheDocument();
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
        expect(screen.getByRole("heading", { name: "Technical checks" })).toBeInTheDocument();
    });

    it("rejects an out-of-range exact preview seed without sending a request", async () => {
        const user = userEvent.setup();
        renderPanel(approvedReview);
        await screen.findByText(previewInstanceQuestion());

        await user.click(screen.getByText("Advanced preview options"));
        const callsBefore = vi.mocked(getAuthoringPreview).mock.calls.length;

        const seedInput = screen.getByLabelText("Exact seed");
        await user.clear(seedInput);
        await user.type(seedInput, "2147483648");
        await user.click(screen.getByRole("button", { name: "Load exact seed" }));

        expect(screen.getByText(/Enter a seed from 0 to 2147483647/)).toBeInTheDocument();
        expect(vi.mocked(getAuthoringPreview).mock.calls.length).toBe(callsBefore);
        expect(screen.getByRole("heading", { name: "Technical checks" })).toBeInTheDocument();
    });

    it("shows a plain relevance mismatch and keeps the score in technical details", async () => {
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

        expect(await screen.findByText("Potential relevance mismatch")).toBeInTheDocument();
        expect(screen.getAllByText("Off topic.").length).toBeGreaterThan(0);
        expect(screen.queryByText("Not relevant")).not.toBeInTheDocument();

        const details = await openTechnicalDetails();
        expect(within(details).getByText("0.42")).toBeInTheDocument();
        expect(within(details).getByText("0.50")).toBeInTheDocument();
    });

    it("shows advisory difficulty confidence and its source only in technical details", async () => {
        renderPanel({
            ...approvedReview,
            difficulty: {
                ...approvedReview.difficulty!,
                confidence: 0.72,
                confidence_source: "self_reported",
            },
        });

        expect(screen.queryByText(/Advisory estimate confidence/)).not.toBeInTheDocument();
        const details = await openTechnicalDetails();
        expect(within(details).getByText("0.72")).toBeInTheDocument();
        expect(within(details).getByText("self reported")).toBeInTheDocument();
    });

    it("labels a historical candidate inside technical details", async () => {
        renderPanel({ ...approvedReview, candidate_is_historical_attempt: true });

        const details = await openTechnicalDetails();
        expect(
            within(details).getByText(/Candidates in the authoring attempts are historical/),
        ).toBeInTheDocument();
    });
});

function previewInstanceQuestion(): string {
    return preview.question.question.question;
}
