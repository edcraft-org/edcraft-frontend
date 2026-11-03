import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { useUserStore } from "@/shared/stores/user.store";
import type { UserResponse } from "@/api/models";

const signedInUser: UserResponse = {
    id: "user-1",
    email: "teacher@example.com",
    name: "Teacher",
    created_at: "2026-11-03T00:00:00Z",
    updated_at: "2026-11-03T00:00:00Z",
};

function renderProtectedRoute() {
    render(
        <MemoryRouter initialEntries={["/ai-authoring"]}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/ai-authoring" element={<div>Protected authoring page</div>} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );
}

describe("ProtectedRoute for AI authoring", () => {
    afterEach(() => {
        cleanup();
        useUserStore.setState({ user: null, isAuthChecked: false });
    });

    it("does not render protected authoring content while signed out", () => {
        useUserStore.setState({ user: null, isAuthChecked: true });

        renderProtectedRoute();

        expect(screen.getByText("Please sign in to continue")).toBeInTheDocument();
        expect(screen.queryByText("Protected authoring page")).not.toBeInTheDocument();
    });

    it("renders the route for a signed-in user", () => {
        useUserStore.setState({ user: signedInUser, isAuthChecked: true });

        renderProtectedRoute();

        expect(screen.getByText("Protected authoring page")).toBeInTheDocument();
    });
});
