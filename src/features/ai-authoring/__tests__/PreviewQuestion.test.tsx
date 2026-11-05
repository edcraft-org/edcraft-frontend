import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { PreviewQuestion } from "../components/PreviewQuestion";
import { ReadableValue } from "../components/ReadableValue";
import type { CodeQuestionInstance } from "../types";
import { previewInstance } from "./fixtures";

vi.mock("../components/ReadOnlyCode", () => ({
    ReadOnlyCode: ({ code, label }: { code: string; label: string }) => (
        <pre aria-label={label}>{code}</pre>
    ),
}));

const structuredInstance: CodeQuestionInstance = {
    ...previewInstance,
    parameters: {
        values: [1, 2, 3],
        count: 3,
    },
    question: {
        ...previewInstance.question,
        inputs: {
            matrix: [
                [1, 2],
                [3, 4],
            ],
            labels: ["first", "second"],
        },
        proposed_answer: {
            values: [
                [1, 2],
                [3, 4],
            ],
        },
        distractors: [[1, 2, 3, 4], { choice: "none" }],
        distractor_reasons: ["Flattens the two rows.", "Does not add anything."],
    },
};

describe("PreviewQuestion", () => {
    afterEach(cleanup);

    it("distinguishes Python values from strings and missing data", () => {
        render(<ReadableValue value={[null, "None", true, "True", 1, "1", "", undefined]} />);

        for (const value of ["None", '"None"', "True", '"True"', "1", '"1"', '""', "Not provided"]) {
            expect(screen.getByText(value, { exact: true })).toBeInTheDocument();
        }
    });

    it("shows readable choices, the correct answer and rationales instead of quoted JSON", () => {
        const { container } = render(<PreviewQuestion instance={structuredInstance} />);

        expect(
            screen.getByRole("heading", { name: structuredInstance.question.question }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Question code").textContent).toBe(
            structuredInstance.question.code,
        );
        expect(screen.getAllByText("Flattens the two rows.").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Does not add anything.").length).toBeGreaterThan(0);
        expect(
            screen.queryByText("Why the other choices are wrong"),
        ).not.toBeInTheDocument();
        const explanation = screen
            .getAllByText("Flattens the two rows.")
            .find((element) => element.parentElement?.classList.contains("p-3"));
        expect(explanation).toBeDefined();
        expect(container).not.toHaveTextContent('{"values":[[1,2],[3,4]]}');
        expect(container).not.toHaveTextContent('"[[1,2],[3,4]]"');

        expect(screen.queryByRole("button", { name: "Show Answer" })).not.toBeInTheDocument();
        expect(screen.queryByText("Answer:")).not.toBeInTheDocument();
        expect(screen.queryByText(/Correct option/)).not.toBeInTheDocument();
        const correctOption = screen.getByText("✓").closest("div.rounded-md");
        expect(correctOption).toHaveClass("bg-green-50");
    });

    it("preserves nested array boundaries in readable values", () => {
        render(<PreviewQuestion instance={structuredInstance} />);

        const inputs = screen.getByLabelText("Question inputs");
        const matrixRow = within(inputs).getByText("matrix").closest("tr");
        expect(matrixRow).not.toBeNull();
        const matrixLists = (matrixRow as HTMLElement).querySelectorAll("ul");

        // matrix -> outer list -> two inner row lists, not one flat list.
        expect(matrixLists).toHaveLength(3);
        expect(matrixLists[0].querySelectorAll(":scope > li")).toHaveLength(2);
        expect(inputs).not.toHaveTextContent("1, 2, 3, 4");
    });

    it("shows a flat record as an input and value table", () => {
        const flatInstance: CodeQuestionInstance = {
            ...structuredInstance,
            question: {
                ...structuredInstance.question,
                inputs: { start: 2, end: 5 },
            },
        };

        render(<PreviewQuestion instance={flatInstance} />);

        const inputs = screen.getByLabelText("Question inputs");
        expect(within(inputs).getByRole("columnheader", { name: "Input" })).toBeInTheDocument();
        expect(within(inputs).getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
        expect(within(inputs).getByText("start")).toBeInTheDocument();
        expect(within(inputs).getByText("end")).toBeInTheDocument();
        expect(within(inputs).getByText("2")).toBeInTheDocument();
        expect(within(inputs).getByText("5")).toBeInTheDocument();
    });

    it("shows one collapsed raw question data disclosure", () => {
        render(<PreviewQuestion instance={structuredInstance} />);

        const summaries = screen.getAllByText("Raw question data");
        expect(summaries).toHaveLength(1);
        const details = summaries[0].closest("details");
        expect(details).not.toBeNull();
        expect(details).not.toHaveAttribute("open");
        expect(details).toHaveTextContent(structuredInstance.template_id);
        expect(screen.queryByText("Technical details")).not.toBeInTheDocument();
    });
});
