import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QuestionInputs } from "../components/QuestionInputs";

describe("QuestionInputs", () => {
    afterEach(cleanup);

    it("renders a flat record as an input and value table", () => {
        render(<QuestionInputs inputs={{ start: 2, end: 5 }} />);

        expect(screen.getByRole("columnheader", { name: "Input" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
        expect(screen.getByText("start")).toBeInTheDocument();
        expect(screen.getByText("end")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("keeps a flat scalar array on one line inside the value cell", () => {
        render(<QuestionInputs inputs={{ values: [40, 41, 42, 43], index: 2 }} />);

        expect(screen.getByText("[40, 41, 42, 43]")).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("shows a muted message for an empty object", () => {
        render(<QuestionInputs inputs={{}} />);

        expect(screen.getByText("No inputs")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("falls back to the readable value for arrays and scalars", () => {
        const { rerender } = render(<QuestionInputs inputs={[1, 2]} />);

        expect(screen.getByText("[1, 2]")).toBeInTheDocument();

        rerender(<QuestionInputs inputs="value" />);
        expect(screen.getByText('"value"')).toBeInTheDocument();
    });
});
