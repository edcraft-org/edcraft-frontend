import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthorForm } from "../components/AuthorForm";
import { createAuthoringJob } from "../services/ai-authoring.service";
import type { AuthoringCapabilities, AuthoringRetryPrefill } from "../types";
import { capabilities, connectionCapabilities } from "./fixtures";

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

function renderForm(
    prefill?: AuthoringRetryPrefill,
    formCapabilities: AuthoringCapabilities = capabilities,
) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: "/ai-authoring",
                        state: prefill ? { authoringPrefill: prefill } : null,
                    },
                ]}
            >
                <AuthorForm capabilities={formCapabilities} />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("AuthorForm", () => {
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
            job_id: "job-1",
            status_url: "/ai-authoring/jobs/job-1",
        });
    });

    afterEach(cleanup);

    it("prefills the prompt and settings from a failed request", () => {
        renderForm({
            prompt: "Write a question about nested loops.",
            difficulty: "hard",
            num_distractors: 2,
            model_profile: "default",
        });

        expect(screen.getByLabelText("Prompt")).toHaveValue(
            "Write a question about nested loops.",
        );
        expect(screen.getByRole("radio", { name: "Hard" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "3 choices" })).toBeChecked();
        expect(screen.getByText("Prefilled")).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Question model" })).toHaveTextContent(
            "Default authoring model",
        );
    });

    it("keeps the normal defaults when there is no prefill", () => {
        renderForm();

        expect(screen.getByLabelText("Prompt")).toHaveValue("");
        expect(screen.getByRole("radio", { name: "Easy" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "4 choices" })).toBeChecked();
        expect(screen.queryByText("Prefilled")).not.toBeInTheDocument();
    });

    it("submits with the selected connection and default model", async () => {
        const user = userEvent.setup();
        renderForm(undefined, connectionCapabilities);

        expect(screen.getByRole("combobox", { name: "Question model" })).toHaveTextContent(
            "My OpenAI",
        );
        expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
            "gpt-test",
        );

        await user.type(screen.getByLabelText("Prompt"), "Create a loop question.");
        await user.click(screen.getByRole("button", { name: "Create question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith({
                domain: "code",
                prompt: "Create a loop question.",
                difficulty: "easy",
                num_distractors: 3,
                connection_id: "connection-1",
                model: "gpt-test",
            });
        });
    });

    it("lets the user pick another discovered model", async () => {
        const user = userEvent.setup();
        renderForm(undefined, connectionCapabilities);

        await user.click(screen.getByRole("combobox", { name: "Model" }));
        await user.click(screen.getByRole("option", { name: "gpt-other" }));
        await user.type(screen.getByLabelText("Prompt"), "Create a loop question.");
        await user.click(screen.getByRole("button", { name: "Create question" }));

        await waitFor(() => {
            expect(createAuthoringJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    connection_id: "connection-1",
                    model: "gpt-other",
                }),
            );
        });
    });

    it("prefills a connection selection from a failed job", () => {
        renderForm(
            {
                prompt: "Retry this.",
                difficulty: "medium",
                num_distractors: 3,
                connection_id: "connection-1",
                model: "gpt-other",
            },
            connectionCapabilities,
        );

        expect(screen.getByRole("combobox", { name: "Model" })).toHaveTextContent(
            "gpt-other",
        );
    });

    it("links to model connections when nothing is configured", () => {
        renderForm(undefined, {
            ...capabilities,
            model_profiles: [],
            connections: [],
        });

        expect(screen.getByRole("link", { name: "Add a model connection" })).toHaveAttribute(
            "href",
            "/settings/model-connections",
        );
    });
});
