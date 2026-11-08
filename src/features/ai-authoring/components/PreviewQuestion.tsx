import { Badge } from "@/components/ui/badge";
import { QuestionContent } from "@/features/questions/components/QuestionContent";
import type { CodeQuestionInstance } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";
import { QuestionInputs } from "./QuestionInputs";
import { ReadOnlyCode } from "./ReadOnlyCode";
import { ReadableValue } from "./ReadableValue";

interface PreviewQuestionProps {
    instance: CodeQuestionInstance;
    headingLevel?: "h2" | "h3";
    /**
     * Review shows the student view with the code always visible and no answer
     * revealed. Generated questions also show their inputs and raw data inline.
     */
    variant?: "review" | "generated";
}

function renderReadableValue(value: unknown) {
    return <ReadableValue value={value} />;
}

export function PreviewQuestion({
    instance,
    headingLevel = "h2",
    variant = "generated",
}: PreviewQuestionProps) {
    const review = variant === "review";
    const Heading = headingLevel;
    const InputsHeading = headingLevel === "h2" ? "h3" : "h4";
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

    const code = <ReadOnlyCode code={question.code} label="Question code" />;
    const inputs = (
        <section aria-label="Question inputs" className="space-y-1">
            <InputsHeading className="text-sm font-medium">Inputs</InputsHeading>
            <QuestionInputs inputs={question.inputs} />
        </section>
    );

    return (
        <article className={review ? "space-y-4" : "space-y-4 rounded-lg border p-4"}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Heading className="min-w-0 text-base font-medium">{question.question}</Heading>
                {!review && <Badge variant="outline">Draft for review</Badge>}
            </div>

            {!review && (
                <p className="text-xs text-muted-foreground">
                    The correct choice is highlighted below.
                </p>
            )}

            {review ? (
                <div className="space-y-1">
                    {question.entry_function && (
                        <p className="font-mono text-xs text-muted-foreground">
                            {question.entry_function}.py
                        </p>
                    )}
                    {code}
                </div>
            ) : (
                code
            )}

            <QuestionContent
                questionType={question.question_type ?? "mcq"}
                options={choices.map((choice) => choice.value)}
                optionExplanations={choices.map((choice) =>
                    choice.correct ? undefined : choice.reason,
                )}
                correctIndices={[correctIndex]}
                answer={question.proposed_answer}
                hideAnswerButton={!review}
                showAnswerByDefault={!review}
                hideAnswerSummary
                renderValue={renderReadableValue}
            />

            {!review && (
                <>
                    {inputs}
                    <EvidenceDetails
                        summary="Raw question data"
                        value={instance}
                        variant="structured"
                    />
                </>
            )}
        </article>
    );
}
