import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewQuestion } from "../components/PreviewQuestion";
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
            values: [1, 2, 3],
            labels: ["first", "second"],
        },
        proposed_answer: { values: [1, 2, 3] },
        distractors: [
            [4, 5],
            { choice: "none" },
        ],
        distractor_reasons: [
            "Adds the first two values.",
            "Does not add anything.",
        ],
    },
};

describe("PreviewQuestion", () => {
    afterEach(cleanup);

    it("shows readable choices, answer and rationales instead of quoted JSON", async () => {
        const user = userEvent.setup();
        const { container } = render(<PreviewQuestion instance={structuredInstance} />);

        expect(
            screen.getByRole("heading", { name: structuredInstance.question.question }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Question code").textContent).toBe(
            structuredInstance.question.code,
        );
        expect(screen.getAllByText("values").length).toBeGreaterThan(0);
        expect(screen.getByText("Adds the first two values.")).toBeInTheDocument();
        expect(screen.getByText("Does not add anything.")).toBeInTheDocument();
        expect(container).not.toHaveTextContent('{"values":[1,2,3]}');
        expect(container).not.toHaveTextContent('"[1,2,3]"');

        await user.click(screen.getByRole("button", { name: "Show Answer" }));

        expect(screen.getByText(/Correct option/)).toHaveTextContent("A");
        expect(screen.getAllByText("values: 1, 2, 3").length).toBeGreaterThan(0);
    });

    it("keeps raw instance data and identifiers in technical details", () => {
        render(<PreviewQuestion instance={structuredInstance} />);

        const summary = screen.getByText("Technical details");
        const details = summary.closest("details");
        expect(details).not.toHaveAttribute("open");
        expect(
            within(details as HTMLElement).getByText(structuredInstance.template_id),
        ).toBeInTheDocument();
        expect(within(details as HTMLElement).getByText("Raw question data")).toBeInTheDocument();
    });
});
