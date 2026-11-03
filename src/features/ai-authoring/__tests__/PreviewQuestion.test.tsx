import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    it("shows readable choices, answer and rationales instead of quoted JSON", async () => {
        const user = userEvent.setup();
        const { container } = render(<PreviewQuestion instance={structuredInstance} />);

        expect(
            screen.getByRole("heading", { name: structuredInstance.question.question }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Question code").textContent).toBe(
            structuredInstance.question.code,
        );
        expect(screen.getByText("Flattens the two rows.")).toBeInTheDocument();
        expect(screen.getByText("Does not add anything.")).toBeInTheDocument();
        expect(container).not.toHaveTextContent('{"values":[[1,2],[3,4]]}');
        expect(container).not.toHaveTextContent('"[[1,2],[3,4]]"');

        await user.click(screen.getByRole("button", { name: "Show Answer" }));

        expect(screen.getByText(/Correct option/)).toHaveTextContent("A");
    });

    it("preserves nested array boundaries in readable values", () => {
        render(<PreviewQuestion instance={structuredInstance} />);

        const inputs = screen.getByLabelText("Question inputs");
        const matrixEntry = within(inputs).getByText("matrix").closest("div");
        expect(matrixEntry).not.toBeNull();
        const matrixLists = (matrixEntry as HTMLElement).querySelectorAll("ul");

        // matrix -> outer list -> two inner row lists, not one flat list.
        expect(matrixLists).toHaveLength(3);
        expect(matrixLists[0].querySelectorAll(":scope > li")).toHaveLength(2);
        expect(inputs).not.toHaveTextContent("1, 2, 3, 4");
    });

    it("keeps raw instance data and identifiers in technical details", () => {
        render(<PreviewQuestion instance={structuredInstance} />);

        const summary = screen.getByText("Technical details");
        const details = summary.closest("details");
        expect(details).not.toHaveAttribute("open");
        expect(details).toHaveTextContent(structuredInstance.template_id);
        expect(within(details as HTMLElement).getByText("Raw question data")).toBeInTheDocument();
    });
});
