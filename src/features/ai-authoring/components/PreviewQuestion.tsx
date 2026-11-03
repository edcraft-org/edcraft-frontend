import { Badge } from "@/components/ui/badge";
import { QuestionContent } from "@/features/questions/components/QuestionContent";
import { formatReadableValue } from "../format";
import type { CodeQuestionInstance } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";
import { ReadOnlyCode } from "./ReadOnlyCode";
import { ReadableValue } from "./ReadableValue";

interface PreviewQuestionProps {
    instance: CodeQuestionInstance;
    headingLevel?: "h3" | "h4";
}

function optionLabel(index: number): string {
    return String.fromCharCode(65 + index);
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
    const options = choices.map((choice) => formatReadableValue(choice.value));
    const wrongChoices = choices
        .map((choice, index) => ({ ...choice, index }))
        .filter((choice) => !choice.correct);

    return (
        <article className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Heading className="min-w-0 text-base font-medium">{question.question}</Heading>
                <Badge variant="outline">Draft for review</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
                Read the code, then use Show Answer to check the correct choice and the explanations
                for the wrong choices.
            </p>

            <ReadOnlyCode code={question.code} label="Question code" />

            <QuestionContent
                questionType={question.question_type ?? "mcq"}
                options={options}
                correctIndices={[correctIndex]}
                answer={formatReadableValue(question.proposed_answer)}
            />

            <section aria-label="Wrong choice explanations" className="space-y-2">
                <h5 className="text-sm font-medium">Why the other choices are wrong</h5>
                <ul className="space-y-2">
                    {wrongChoices.map((choice) => (
                        <li
                            key={`${choice.index}-${formatReadableValue(choice.value)}`}
                            className="rounded-md border p-2 text-sm"
                        >
                            <p>
                                <span className="font-medium">
                                    {optionLabel(choice.index)}.
                                </span>{" "}
                                {formatReadableValue(choice.value)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {choice.reason ?? "No explanation provided."}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
                <section aria-label="Question inputs" className="space-y-1">
                    <h5 className="text-sm font-medium">Inputs</h5>
                    <ReadableValue value={question.inputs} />
                </section>
                <section aria-label="Question parameters" className="space-y-1">
                    <h5 className="text-sm font-medium">Parameters</h5>
                    <ReadableValue value={instance.parameters} />
                </section>
            </div>

            <details className="rounded-md border bg-muted/30 p-3 text-sm">
                <summary className="cursor-pointer font-medium">Technical details</summary>
                <div className="mt-3 space-y-4">
                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-muted-foreground">Template ID</dt>
                            <dd className="break-all font-mono">{instance.template_id}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Artifact ID</dt>
                            <dd className="break-all font-mono">
                                {instance.artifact_id ?? "Not reported"}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Preview seed</dt>
                            <dd className="font-mono">{instance.seed}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Entry function</dt>
                            <dd className="break-all font-mono">{question.entry_function}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Answer target</dt>
                            <dd>{(question.answer_target ?? "return_value").replaceAll("_", " ")}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Question type</dt>
                            <dd>{(question.question_type ?? "mcq").toUpperCase()}</dd>
                        </div>
                    </dl>
                    <EvidenceDetails summary="Raw question data" value={instance} />
                </div>
            </details>
        </article>
    );
}
