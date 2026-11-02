import { formatValue } from "../format";
import type { ReviewTemplate } from "../types";
import { ReadOnlyCode } from "./ReadOnlyCode";

export function TemplateArtifact({ template }: { template: ReviewTemplate }) {
    const candidate = template.candidate;
    return (
        <details className="rounded-md border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium">
                Technically checked template artifact
            </summary>
            <div className="mt-3 space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Template</dt>
                        <dd className="break-all font-mono text-xs">{candidate.template_id}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Entry function</dt>
                        <dd className="font-mono text-xs">{candidate.entry_function}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Difficulty</dt>
                        <dd className="capitalize">{candidate.difficulty}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Answer target</dt>
                        <dd>{candidate.answer_target.replaceAll("_", " ")}</dd>
                    </div>
                </dl>

                <ReadOnlyCode code={candidate.code} label="Checked template code" />

                <div>
                    <h5 className="text-sm font-medium">Question template</h5>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border bg-background p-3 text-xs">
                        {candidate.question_template}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <h5 className="text-sm font-medium">Parameters</h5>
                        <pre className="mt-1 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                            {formatValue(candidate.parameters)}
                        </pre>
                    </div>
                    <div>
                        <h5 className="text-sm font-medium">Answer expression</h5>
                        <pre className="mt-1 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                            {candidate.answer_expression}
                        </pre>
                    </div>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Distractor recipes</h5>
                    <ol className="mt-1 space-y-2">
                        {candidate.distractors.map((distractor) => (
                            <li
                                key={`${distractor.expression}-${distractor.reason_template}`}
                                className="rounded-md border bg-background p-2 text-xs"
                            >
                                <p className="font-mono">{distractor.expression}</p>
                                <p className="mt-1 text-muted-foreground">
                                    {distractor.reason_template}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </details>
    );
}
