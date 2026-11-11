import type { CodeQuestionInstance } from "../types";
import { GenericQuestionView } from "./GenericQuestionView";
import { QuestionInputs } from "./QuestionInputs";
import { ReadOnlyCode } from "./ReadOnlyCode";

interface CodeQuestionViewProps {
    instance: CodeQuestionInstance;
    review: boolean;
    inputsHeadingLevel: "h3" | "h4";
}

/**
 * Code-domain view: the code, entry function and generated inputs around the
 * shared question/choice renderer.
 */
export function CodeQuestionView({
    instance,
    review,
    inputsHeadingLevel,
}: CodeQuestionViewProps) {
    const { question } = instance;
    const InputsHeading = inputsHeadingLevel;
    const code = <ReadOnlyCode code={question.code} label="Question code" />;

    return (
        <>
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

            <GenericQuestionView payload={instance} review={review} />

            {!review && (
                <section aria-label="Question inputs" className="space-y-1">
                    <InputsHeading className="text-sm font-medium">Inputs</InputsHeading>
                    <QuestionInputs inputs={question.inputs} />
                </section>
            )}
        </>
    );
}
