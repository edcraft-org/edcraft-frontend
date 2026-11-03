import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatValue } from "../format";
import type { CodeQuestionInstance } from "../types";
import { ReadOnlyCode } from "./ReadOnlyCode";

interface PreviewQuestionProps {
    instance: CodeQuestionInstance;
    headingLevel?: "h3" | "h4";
}

export function PreviewQuestion({ instance, headingLevel = "h4" }: PreviewQuestionProps) {
    const Heading = headingLevel;
    const { question } = instance;
    const distractorReasons = question.distractor_reasons ?? [];

    return (
        <article className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Heading className="font-medium">{question.question}</Heading>
                <Badge variant="outline">Seed {instance.seed}</Badge>
                <Badge variant="secondary">
                    {(question.question_type ?? "mcq").toUpperCase()}
                </Badge>
                <Badge variant="outline">Draft — review before use</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
                Entry function <code className="font-mono">{question.entry_function}</code> ·
                Answer target {(question.answer_target ?? "return_value").replaceAll("_", " ")}
            </p>

            <p className="text-xs text-muted-foreground">
                Generated instances are drafts. Review the code, parameters, answer and rationales
                before using them.
            </p>

            <ReadOnlyCode code={question.code} label="Generated question code" />

            <div className="grid gap-4 md:grid-cols-2">
                <section aria-label="Generated parameters" className="space-y-1">
                    <h5 className="text-sm font-medium">Parameters</h5>
                    <pre className="overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                        {formatValue(instance.parameters)}
                    </pre>
                    <h5 className="pt-2 text-sm font-medium">Inputs</h5>
                    <pre className="overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                        {formatValue(question.inputs)}
                    </pre>
                </section>

                <section aria-label="Answer and distractors" className="space-y-3">
                    <div>
                        <h5 className="text-sm font-medium">Correct answer</h5>
                        <pre className="overflow-auto rounded-md border border-green-500/40 bg-green-50 p-3 text-xs dark:bg-green-950/30">
                            {formatValue(question.proposed_answer)}
                        </pre>
                    </div>
                    <div>
                        <h5 className="text-sm font-medium">Distractors and rationales</h5>
                        <ol className="space-y-2">
                            {question.distractors.map((distractor, index) => (
                                <li key={index} className="rounded-md border p-2 text-sm">
                                    <div className="font-mono text-xs">
                                        {formatValue(distractor)}
                                    </div>
                                    <Separator className="my-2" />
                                    <p className="text-xs text-muted-foreground">
                                        {distractorReasons[index] ?? "No rationale provided."}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>
            </div>
        </article>
    );
}
