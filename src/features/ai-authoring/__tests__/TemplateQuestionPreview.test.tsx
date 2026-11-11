import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CodeTemplateCandidate } from "@/api/models";
import { TemplateQuestionPreview } from "../components/TemplateQuestionPreview";
import { approvedReview, stubReview } from "./fixtures";

vi.mock("../components/ReadOnlyCode", () => ({
    ReadOnlyCode: ({ code, label }: { code: string; label: string }) => (
        <pre aria-label={label}>{code}</pre>
    ),
}));

describe("TemplateQuestionPreview", () => {
    afterEach(cleanup);

    it("keeps the code template view for the code domain", () => {
        const candidate = approvedReview.template!.candidate as CodeTemplateCandidate;
        render(
            <TemplateQuestionPreview
                template={approvedReview.template!}
                domain="code"
            />,
        );

        expect(screen.getByLabelText("Template code").textContent).toBe(candidate.code);
        expect(screen.getByText(/What does list_sum/)).toBeInTheDocument();
    });

    it("renders stub-domain candidate fields without a code block", () => {
        render(
            <TemplateQuestionPreview template={stubReview.template!} domain="stub" />,
        );

        expect(
            screen.getByRole("heading", { name: "Which of these numbers is even?" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Template fields")).toBeInTheDocument();
        expect(screen.queryByLabelText("Template code")).not.toBeInTheDocument();
        expect(screen.getByText("Question template")).toBeInTheDocument();
        expect(screen.getByText("Answer expression")).toBeInTheDocument();
    });
});
