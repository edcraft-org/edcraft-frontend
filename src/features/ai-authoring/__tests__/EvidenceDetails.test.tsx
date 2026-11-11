import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EvidenceDetails } from "../components/EvidenceDetails";
import { formatDate } from "../format";

describe("EvidenceDetails", () => {
    afterEach(cleanup);

    it("renders technical checks as labelled fields and keeps raw JSON available", () => {
        render(
            <EvidenceDetails
                summary="Automated checks (1)"
                variant="structured"
                value={[
                    {
                        tool: "code_require_features",
                        status: "passed",
                        advisory: false,
                        findings: [],
                        error: null,
                    },
                ]}
            />,
        );

        expect(screen.getByText("Code Require Features")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Passed")).toBeInTheDocument();
        expect(screen.getByText("Advisory")).toBeInTheDocument();
        expect(screen.getByText("No")).toBeInTheDocument();
        expect(screen.getByText("Raw JSON")).toBeInTheDocument();
    });

    it("renders nested findings as a table", () => {
        render(
            <EvidenceDetails
                summary="Automated checks (1)"
                variant="structured"
                value={[
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
                    },
                ]}
            />,
        );

        expect(screen.getByText("A sampled example failed to execute.")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Code" })).toBeInTheDocument();
        expect(screen.getByText("SAMPLE_EXECUTION_FAILED")).toBeInTheDocument();
    });

    it("renders distractor recipes as an expression and reason table", () => {
        render(
            <EvidenceDetails
                summary="Distractors"
                variant="structured"
                value={[
                    {
                        expression: "a - b",
                        reason_template: "Subtracts instead of adding.",
                    },
                    {
                        expression: "a * 2",
                        reason_template: "Doubles the input.",
                    },
                ]}
            />,
        );

        expect(screen.getByRole("columnheader", { name: "Expression" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Reason" })).toBeInTheDocument();
        expect(screen.getByText("a - b")).toBeInTheDocument();
        expect(screen.getByText("Subtracts instead of adding.")).toBeInTheDocument();
        expect(screen.getAllByRole("row")).toHaveLength(3);
    });

    it("renders parameters as a name, kind and values table", () => {
        render(
            <EvidenceDetails
                summary="Parameters"
                variant="structured"
                value={[
                    { name: "n", kind: "integer", values: [1, 2, 3] },
                    { name: "k", kind: "integer", values: [2, 4] },
                ]}
            />,
        );

        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Kind" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Values" })).toBeInTheDocument();
        expect(screen.getByText("1, 2, 3")).toBeInTheDocument();
        expect(screen.getByText("2, 4")).toBeInTheDocument();
    });

    it("renders list-valued parameters inline in the values column", () => {
        render(
            <EvidenceDetails
                summary="Parameters"
                variant="structured"
                value={[
                    { name: "values", kind: "integer_list", values: [[1, 2], [3, 4]] },
                ]}
            />,
        );

        expect(screen.getByRole("columnheader", { name: "Values" })).toBeInTheDocument();
        expect(screen.getByText("[1, 2], [3, 4]")).toBeInTheDocument();
    });

    it("formats approval timestamps instead of showing ISO strings", () => {
        const decidedAt = "2026-11-03T00:00:00Z";
        render(
            <EvidenceDetails
                summary="Approval record"
                variant="structured"
                value={{
                    decision: "approved",
                    reviewer: "teacher@example.com",
                    decided_at: decidedAt,
                    note: null,
                }}
            />,
        );

        expect(screen.getByText("teacher@example.com")).toBeInTheDocument();
        expect(screen.getByText(formatDate(decidedAt))).toBeInTheDocument();
        expect(screen.queryByText(decidedAt)).not.toBeInTheDocument();
    });

    it("shows simple arrays as lists", () => {
        render(
            <EvidenceDetails
                summary="Raw warnings"
                variant="structured"
                value={["DIFFICULTY_MISMATCH", "ADVISORY_ASSESSMENT_UNAVAILABLE"]}
            />,
        );

        expect(screen.getByText("DIFFICULTY_MISMATCH")).toBeInTheDocument();
        expect(screen.getByText("ADVISORY_ASSESSMENT_UNAVAILABLE")).toBeInTheDocument();
        expect(screen.getByText("Raw JSON")).toBeInTheDocument();
    });

    it("keeps the raw JSON variant for callers that need the exact payload", () => {
        render(
            <EvidenceDetails summary="Raw question data" value={{ question: "2 + 2?" }} />,
        );

        expect(screen.queryByText("Raw JSON")).not.toBeInTheDocument();
        expect(screen.getByText(/"question": "2 \+ 2\?"/)).toBeInTheDocument();
    });

    it("does not treat a generic candidate with a code key as a code item", () => {
        render(
            <EvidenceDetails
                summary="Candidates"
                variant="structured"
                value={[
                    {
                        code: "M-1",
                        question: "Solve x + 1 = 2",
                        metadata: { source: "math" },
                    },
                ]}
            />,
        );

        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("M-1")).toBeInTheDocument();
        expect(screen.getByText("Solve x + 1 = 2")).toBeInTheDocument();
    });

    it("renders nothing when the payload is empty", () => {
        const { container } = render(
            <EvidenceDetails summary="Automated checks (0)" variant="structured" value={[]} />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
