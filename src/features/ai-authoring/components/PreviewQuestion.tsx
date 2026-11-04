import { Badge } from "@/components/ui/badge";
import { QuestionContent } from "@/features/questions/components/QuestionContent";
import type { CodeQuestionInstance } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";
import { ReadOnlyCode } from "./ReadOnlyCode";
import { ReadableValue } from "./ReadableValue";

interface PreviewQuestionProps {
    instance: CodeQuestionInstance;
    headingLevel?: "h3" | "h4";
}

function renderReadableValue(value: unknown) {
    return <ReadableValue value={value} />;
}

export function PreviewQuestion({ instance, headingLevel = "h4" }: PreviewQuestionProps) {
    const Heading = headingLevel;
    const { question } = instance;
    const distractors = question.distractors ?? [];
    const distractorReasons = question.distractor_reasons ?? [];
    // Keep the correct choice deterministic but not always first. This is
    // presentation only; the exported instance keeps the canonical answer.
    const correctIndex =
        distractors.length > 0 ? instance.seed % (distractors.length + 1) : 0;
    const choices: Array<{ value: unknown; reason?: string; correct: boolean }> = distractors.map(
        (value, index) => ({
            value,
            reason: distractorReasons[index],
            correct: false,
        }),
    );
    choices.splice(correctIndex, 0, {
        value: question.proposed_answer,
        reason: undefined,
        correct: true,
    });
    return (
        <article className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Heading className="min-w-0 text-base font-medium">{question.question}</Heading>
                <Badge variant="outline">Draft for review</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
                The correct choice is highlighted below.
            </p>

            <ReadOnlyCode code={question.code} label="Question code" />

            <QuestionContent
                questionType={question.question_type ?? "mcq"}
                options={choices.map((choice) => choice.value)}
                optionExplanations={choices.map((choice) =>
                    choice.correct ? undefined : choice.reason,
                )}
                correctIndices={[correctIndex]}
                answer={question.proposed_answer}
                hideAnswerButton
                showAnswerByDefault
                hideAnswerSummary
                renderValue={renderReadableValue}
            />

            <section aria-label="Question inputs" className="space-y-1">
                <h5 className="text-sm font-medium">Inputs</h5>
                <ReadableValue value={question.inputs} />
            </section>

            <details className="rounded-md border bg-muted/30 p-3 text-sm">
                <summary className="cursor-pointer font-medium">Technical details</summary>
                <div className="mt-3">
                    <EvidenceDetails summary="Raw question data" value={instance} />
                </div>
            </details>
        </article>
    );
}
