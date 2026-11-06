import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ChecksPanel } from "../components/ChecksPanel";
import type { AuthoringCheck } from "../types";

const checks: AuthoringCheck[] = [
    {
        tool: "code_verify_template_structure",
        status: "passed",
        advisory: false,
        findings: [],
        error: null,
    },
    {
        tool: "code_require_features",
        status: "passed",
        advisory: false,
        findings: [],
        error: null,
    },
    {
        tool: "code_validate_answers_and_distractors",
        status: "failed",
        advisory: false,
        findings: [
            {
                code: "SAMPLE_EXECUTION_FAILED",
                field: "code",
                message: "A sampled example failed to execute.",
            },
        ],
        error: "The check could not evaluate a sample.",
    },
    {
        tool: "difficulty_assessment",
        status: "failed",
        advisory: true,
        findings: [
            {
                code: "DIFFICULTY_MISMATCH",
                field: "difficulty",
                message: "Estimated difficulty is harder than requested.",
            },
        ],
        error: null,
    },
];

describe("ChecksPanel", () => {
    afterEach(cleanup);

    it("lists every technical check with labels, screen-reader statuses and descriptions", () => {
        render(<ChecksPanel checks={checks} />);

        expect(screen.getByText("1 of 3 technical checks need attention.")).toBeInTheDocument();

        expect(screen.getByText("Question template")).toBeInTheDocument();
        expect(screen.getByText("Required features")).toBeInTheDocument();
        expect(screen.getByText("Answers and wrong choices")).toBeInTheDocument();
        const passedStatuses = screen.getAllByText(/Passed:/);
        expect(passedStatuses).toHaveLength(2);
        for (const status of passedStatuses) expect(status).toHaveClass("sr-only");
        expect(screen.getByText(/Needs attention:/)).toHaveClass("sr-only");

        expect(
            screen.getByText("The template is structurally valid and renders."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("The requested Python features are present."),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "The answer and every wrong choice evaluate correctly and are distinct.",
            ),
        ).toBeInTheDocument();
    });

    it("shows the error and findings under a failing technical check", () => {
        render(<ChecksPanel checks={checks} />);

        expect(
            screen.getByText("The check could not evaluate a sample."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("A sampled example failed to execute."),
        ).toBeInTheDocument();
    });

    it("shows a shared preflight failure once and references it from later checks", () => {
        const shared = {
            code: "TEMPLATE_INVALID",
            field: "answer_expression",
            message:
                'answer_expression "a + b": template expression exceeds 500 characters. ' +
                "Expressions use bare parameter names.",
        };
        const explanation =
            "template expression exceeds 500 characters. Expressions use bare parameter names.";

        render(
            <ChecksPanel
                checks={[
                    {
                        tool: "code_verify_template_structure",
                        status: "failed",
                        advisory: false,
                        findings: [shared],
                        error: null,
                    },
                    {
                        tool: "code_validate_answers_and_distractors",
                        status: "failed",
                        advisory: false,
                        findings: [shared],
                        error: null,
                    },
                ]}
            />,
        );

        expect(screen.getAllByText(explanation)).toHaveLength(1);
        expect(
            screen.getByText("Same underlying issue as Question template."),
        ).toBeInTheDocument();
        expect(screen.getByText("2 of 2 technical checks need attention.")).toBeInTheDocument();
    });

    it("does not list advisory checks or the old correctness disclaimer", () => {
        render(<ChecksPanel checks={checks} />);

        expect(screen.queryByText("difficulty assessment")).not.toBeInTheDocument();
        expect(
            screen.queryByText("Estimated difficulty is harder than requested."),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/They cannot prove the question is correct/),
        ).not.toBeInTheDocument();
    });
});
