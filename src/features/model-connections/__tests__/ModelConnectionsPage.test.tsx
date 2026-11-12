import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
    cleanup,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ModelConnectionsPage from "../pages/ModelConnectionsPage";
import {
    createProviderConnection,
    deleteProviderConnection,
    listProviderConnections,
    probeProviderConnection,
} from "../services/model-connections.service";
import { connection } from "@/features/ai-authoring/__tests__/fixtures";

vi.mock("../services/model-connections.service", () => ({
    listProviderConnections: vi.fn(),
    createProviderConnection: vi.fn(),
    probeProviderConnection: vi.fn(),
    updateProviderConnection: vi.fn(),
    deleteProviderConnection: vi.fn(),
    testProviderConnection: vi.fn(),
}));

function renderPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <ModelConnectionsPage />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("ModelConnectionsPage", () => {
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
        vi.mocked(listProviderConnections).mockResolvedValue([connection]);
        vi.mocked(deleteProviderConnection).mockResolvedValue(undefined);
    });

    afterEach(cleanup);

    it("lists saved connections without exposing the key", async () => {
        renderPage();

        expect(await screen.findByText("My OpenAI")).toBeInTheDocument();
        expect(screen.getByText(/Key ending 1234/)).toBeInTheDocument();
        expect(screen.getByText("gpt-test")).toBeInTheDocument();
        expect(screen.queryByText("sk-test-secret-1234")).not.toBeInTheDocument();
    });

    it("shows the empty state when there are no connections", async () => {
        vi.mocked(listProviderConnections).mockResolvedValue([]);
        renderPage();

        expect(await screen.findByText("No model connections yet")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Add your first connection" }),
        ).toBeInTheDocument();
    });

    it("creates a connection from the dialog", async () => {
        const user = userEvent.setup();
        vi.mocked(createProviderConnection).mockResolvedValue({
            ...connection,
            id: "connection-2",
            name: "Personal OpenAI",
        });
        renderPage();
        await screen.findByText("My OpenAI");

        await user.click(screen.getByRole("button", { name: "Add connection" }));
        const dialog = await screen.findByRole("dialog");
        await user.type(within(dialog).getByLabelText("Name"), "Personal OpenAI");
        await user.type(within(dialog).getByLabelText("API key"), "sk-new-1234");
        await user.type(within(dialog).getByLabelText("Default model"), "gpt-4.1-mini");
        await user.click(within(dialog).getByRole("button", { name: "Add connection" }));

        await waitFor(() => {
            expect(createProviderConnection).toHaveBeenCalledWith({
                name: "Personal OpenAI",
                kind: "openai",
                base_url: null,
                api_key: "sk-new-1234",
                default_model: "gpt-4.1-mini",
                models: [],
            });
        });
    });

    it("loads discoverable models into the dialog", async () => {
        const user = userEvent.setup();
        vi.mocked(probeProviderConnection).mockResolvedValue({
            models: ["gpt-a", "gpt-b"],
            default_model: "gpt-a",
        });
        renderPage();
        await screen.findByText("My OpenAI");

        await user.click(screen.getByRole("button", { name: "Add connection" }));
        const dialog = await screen.findByRole("dialog");
        await user.type(within(dialog).getByLabelText("API key"), "sk-probe-1234");
        await user.click(within(dialog).getByRole("button", { name: "Load models" }));

        await waitFor(() => {
            expect(probeProviderConnection).toHaveBeenCalledWith({
                kind: "openai",
                base_url: null,
                api_key: "sk-probe-1234",
            });
        });
        expect(within(dialog).getByLabelText("Default model")).toHaveValue("gpt-a");
    });

    it("deletes a connection after confirmation", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("My OpenAI");

        await user.click(screen.getByRole("button", { name: "Delete" }));
        await user.click(screen.getByRole("button", { name: "Delete connection" }));

        await waitFor(() => {
            expect(deleteProviderConnection).toHaveBeenCalledWith("connection-1");
        });
    });
});
