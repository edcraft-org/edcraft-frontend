import type { CodeTemplateCandidate } from "@/api/models";
import { QuestionContent } from "@/features/questions/components/QuestionContent";
import type { AuthoringTemplateCandidate, ReviewTemplate } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";
import { isRecord } from "./questionPayload";
import { ReadOnlyCode } from "./ReadOnlyCode";

interface TemplateQuestionPreviewProps {
    template: ReviewTemplate;
    /** Authoring domain from the review request. */
    domain?: string;
}

function renderExpression(value: unknown) {
    return <span className="break-words font-mono text-sm">{String(value)}</span>;
}

function isCodeCandidate(
    candidate: AuthoringTemplateCandidate,
): candidate is CodeTemplateCandidate {
    return (
        isRecord(candidate) &&
        typeof candidate.code === "string" &&
        typeof candidate.question_template === "string" &&
        Array.isArray(candidate.distractors)
    );
}

/** Code-domain template rendered the way a student would see it. */
function CodeTemplateView({ candidate }: { candidate: CodeTemplateCandidate }) {
    const choices = [
        { value: candidate.answer_expression, correct: true, reason: undefined },
        ...candidate.distractors.map((distractor) => ({
            value: distractor.expression,
            correct: false,
            reason: distractor.reason_template,
        })),
    ];
    return (
        <article className="space-y-4">
            <h3 className="min-w-0 text-base font-medium">{candidate.question_template}</h3>

            <ReadOnlyCode code={candidate.code} label="Template code" />

            <QuestionContent
                questionType={candidate.question_type ?? "mcq"}
                options={choices.map((choice) => choice.value)}
                optionExplanations={choices.map((choice) =>
                    choice.correct ? undefined : choice.reason,
                )}
                correctIndices={[0]}
                answer={candidate.answer_expression}
                hideAnswerButton
                showAnswerByDefault
                hideAnswerSummary
                renderValue={renderExpression}
            />
        </article>
    );
}

/** Domain-neutral fallback: show the candidate fields without code assumptions. */
function GenericTemplateView({ candidate }: { candidate: AuthoringTemplateCandidate }) {
    const record = isRecord(candidate) ? candidate : {};
    const heading =
        typeof record.question_template === "string"
            ? record.question_template
            : typeof record.question === "string"
              ? record.question
              : "Question template";

    return (
        <article className="space-y-4">
            <h3 className="min-w-0 text-base font-medium">{heading}</h3>
            <EvidenceDetails
                summary="Template fields"
                value={candidate}
                variant="structured"
            />
        </article>
    );
}

/**
 * The reusable template shown the way a student would see the generated
 * question. Template metadata stays in Technical details so reviewers can
 * focus on the question itself.
 */
export function TemplateQuestionPreview({
    template,
    domain,
}: TemplateQuestionPreviewProps) {
    const { candidate } = template;
    // Only the code view assumes the code candidate shape. Unknown domains
    // always take the field-based fallback.
    const showCode = (domain === undefined || domain === "code") && isCodeCandidate(candidate);

    return showCode ? (
        <CodeTemplateView candidate={candidate} />
    ) : (
        <GenericTemplateView candidate={candidate} />
    );
}
