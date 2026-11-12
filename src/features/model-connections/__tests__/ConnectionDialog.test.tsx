import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionDialog } from "../components/ConnectionDialog";
import {
    probeProviderConnection,
    testProviderConnection,
    updateProviderConnection,
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

function renderDialog() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <ConnectionDialog open onOpenChange={vi.fn()} connection={connection} />
        </QueryClientProvider>,
    );
}

describe("ConnectionDialog", () => {
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
        vi.mocked(updateProviderConnection).mockResolvedValue(connection);
        vi.mocked(testProviderConnection).mockResolvedValue({
            models: connection.models,
            default_model: connection.default_model,
        });
        vi.mocked(probeProviderConnection).mockResolvedValue({
            models: ["new-model"],
            default_model: "new-model",
        });
    });

    afterEach(cleanup);

    it("requires a fresh key to test an edited base URL and saves no stale models", async () => {
        const user = userEvent.setup();
        renderDialog();
        const dialog = await screen.findByRole("dialog");

        expect(
            within(dialog).getByText("2 models discovered from this provider."),
        ).toBeInTheDocument();

        const baseUrl = within(dialog).getByLabelText("Base URL");
        await user.clear(baseUrl);
        await user.type(baseUrl, "https://new.example.com/v1");

        expect(
            within(dialog).queryByText("2 models discovered from this provider."),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).getByText("Load models to discover the names this key can use."),
        ).toBeInTheDocument();

        await user.click(within(dialog).getByRole("button", { name: "Load models" }));

        expect(testProviderConnection).not.toHaveBeenCalled();
        expect(probeProviderConnection).not.toHaveBeenCalled();
        expect(
            within(dialog).getByText("Enter the API key again to test the updated base URL."),
        ).toBeInTheDocument();

        await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

        await waitFor(() => {
            expect(updateProviderConnection).toHaveBeenCalledWith(connection.id, {
                name: connection.name,
                base_url: "https://new.example.com/v1",
                default_model: connection.default_model,
                models: [],
            });
        });
    });

    it("still tests the stored connection when only its trailing slash changed", async () => {
        const user = userEvent.setup();
        renderDialog();
        const dialog = await screen.findByRole("dialog");

        const baseUrl = within(dialog).getByLabelText("Base URL");
        await user.clear(baseUrl);
        await user.type(baseUrl, `${connection.base_url}/`);

        await user.click(within(dialog).getByRole("button", { name: "Load models" }));

        await waitFor(() => {
            expect(testProviderConnection).toHaveBeenCalledWith(connection.id);
        });
        expect(probeProviderConnection).not.toHaveBeenCalled();
    });
});
