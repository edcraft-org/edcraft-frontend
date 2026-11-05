import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WarningsPanel } from "../components/WarningsPanel";

describe("WarningsPanel", () => {
    afterEach(cleanup);

    it("renders warning text visibly without a disclosure", () => {
        render(<WarningsPanel warnings={["A duplicate was produced.", "A seed was reused."]} />);

        expect(screen.getByRole("heading", { name: "Warnings" })).toBeInTheDocument();
        const warning = screen.getByText("A duplicate was produced.");
        expect(warning).toBeVisible();
        expect(warning.closest("details")).toBeNull();
        expect(screen.getByText("A seed was reused.")).toBeVisible();
    });

    it("renders nothing when there are no warnings", () => {
        const { container: empty } = render(<WarningsPanel warnings={[]} />);
        expect(empty).toBeEmptyDOMElement();

        const { container: missing } = render(<WarningsPanel warnings={null} />);
        expect(missing).toBeEmptyDOMElement();
    });
});
