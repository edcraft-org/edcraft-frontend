import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RetryPanel } from "../components/RetryPanel";
import { createAuthoringJob } from "../services/ai-authoring.service";
import type { AuthoringCapabilities, AuthoringReview } from "../types";
import { approvedReview, capabilities, connectionCapabilities } from "./fixtures";

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

const request = approvedReview.request;

function renderPanel(
    panelCapabilities: AuthoringCapabilities = capabilities,
    panelRequest: AuthoringReview["request"] = request,
) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/ai-authoring/failed-job"]}>
                <Routes>
                    <Route
                        path="/ai-authoring/failed-job"
                        element={
                            <RetryPanel
                                request={panelRequest}
                                capabilities={panelCapabilities}
                            />
                        }
                    />
                    <Route path="/ai-authoring" element={<LocationProbe />} />
                    <Route path="/ai-authoring/:jobId" element={<div />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

function LocationProbe() {
    const location = useLocation();
    return <pre data-testid="location-state">{JSON.stringify(location.state)}</pre>;
}

describe("RetryPanel", () => {
    beforeAll(() => {
        Object.defineProperty(Element.prototype, "hasPointerCapture", {
            configurable: true,
            value: () => false,
        });
        Element.prototype.setPointerCapture = vi.fn();
        Element.prototype.releasePointerCapture = vi.fn();
        Element.prototype.scrollIntoView = vi.fn();
    });

    beforeEach(() => {
        vi.mocked(createAuthoringJob).mockResolvedValue({
            job_id: "job-2",
            status_url: "/ai-authoring/jobs/job-2",
        });
    });

    afterEach(cleanup);

    it("retries the exact request with the original model", async () => {
        const user = userEvent.setup();
        renderPanel();

        expect(screen.getByText(request.prompt)).toBeInTheDocument();
        expect(screen.getByText("4 choices")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: request.prompt,
                difficulty: request.difficulty,
                num_distractors: request.num_distractors,
                model_profile: "default",
            });
        });
    });

    it("lets the user retry with a different configured model", async () => {
        const twoModels: AuthoringCapabilities = {
            ...capabilities,
            model_profiles: [
                ...capabilities.model_profiles,
                {
                    id: "alternate",
                    label: "Alternate authoring model",
                    provider: "openai",
                    model: "other-model",
                },
            ],
        };
        const user = userEvent.setup();
        renderPanel(twoModels);

        await user.click(screen.getByLabelText("Question model"));
        await user.click(screen.getByRole("option", { name: /Alternate authoring model/ }));
        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith(
                expect.objectContaining({ model_profile: "alternate" }),
            );
        });
    });

    it("falls back when the original model is no longer configured", () => {
        renderPanel({
            ...capabilities,
            model_profiles: [
                {
                    id: "alternate",
                    label: "Alternate authoring model",
                    provider: "openai",
                    model: "other-model",
                },
            ],
        });

        expect(
            screen.getByText(/The original model is no longer available/),
        ).toBeInTheDocument();
    });

    it("retries with the original connection model", async () => {
        const user = userEvent.setup();
        renderPanel(connectionCapabilities, {
            ...request,
            model_profile: null,
            connection_id: "connection-1",
            model: "gpt-other",
        });

        expect(screen.getByRole("combobox", { name: "Question model" })).toHaveTextContent(
            "My OpenAI",
        );
        expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
            "gpt-other",
        );
        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: request.prompt,
                difficulty: request.difficulty,
                num_distractors: request.num_distractors,
                connection_id: "connection-1",
                model: "gpt-other",
            });
        });
    });

    it("falls back when the original connection is no longer available", () => {
        renderPanel(connectionCapabilities, {
            ...request,
            model_profile: null,
            connection_id: "deleted-connection",
            model: "gpt-other",
        });

        expect(
            screen.getByText(/The original model is no longer available/),
        ).toBeInTheDocument();
    });

    it("preserves advisory model overrides when retrying", async () => {
        const user = userEvent.setup();
        renderPanel(connectionCapabilities, {
            ...request,
            model_profile: null,
            connection_id: "connection-1",
            model: "gpt-test",
            judges: {
                relevance: {
                    connection_id: "connection-1",
                    model: "gpt-other",
                },
            },
        });

        expect(screen.getByRole("combobox", { name: "Relevance check" })).toHaveTextContent(
            "My OpenAI",
        );
        expect(screen.getByRole("combobox", { name: "Difficulty check" })).toHaveTextContent(
            "Same as question model",
        );

        await user.click(screen.getByRole("button", { name: "Retry question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: request.prompt,
                difficulty: request.difficulty,
                num_distractors: request.num_distractors,
                connection_id: "connection-1",
                model: "gpt-test",
                judges: {
                    relevance: {
                        connection_id: "connection-1",
                        model: "gpt-other",
                    },
                },
            });
        });
    });

    it("passes the request into the edit form", async () => {
        const user = userEvent.setup();
        renderPanel();

        await user.click(screen.getByRole("link", { name: "Edit request" }));

        expect(screen.getByTestId("location-state")).toHaveTextContent(
            JSON.stringify({
                authoringPrefill: {
                    prompt: request.prompt,
                    difficulty: request.difficulty,
                    num_distractors: request.num_distractors,
                    model_profile: "default",
                },
            }),
        );
    });
});
