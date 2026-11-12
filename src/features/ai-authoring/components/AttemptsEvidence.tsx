import { EvidenceDetails } from "./EvidenceDetails";
import type { ReviewAttempt } from "../types";

interface AttemptsEvidenceProps {
    attempts: ReviewAttempt[];
}

function checkSummary(attempt: ReviewAttempt): string {
    const checks = attempt.checks ?? [];
    if (checks.length === 0) return "No checks recorded";
    const passed = checks.filter((check) => check.status === "passed").length;
    return `${passed}/${checks.length} checks passed`;
}

/**
 * Authoring attempts carry a full candidate each, so they are collapsed one at a
 * time. Within an attempt, the candidate keeps its own disclosure so large code
 * templates, parameter tables and distractor tables stay scannable.
 */
export function AttemptsEvidence({ attempts }: AttemptsEvidenceProps) {
    if (attempts.length === 0) return null;

    return (
        <details className="rounded-md border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium">
                Authoring attempts ({attempts.length})
            </summary>
            <ol className="mt-3 space-y-2">
                {attempts.map((attempt) => {
                    const checks = attempt.checks ?? [];
                    const pending = attempt.pending ?? [];
                    return (
                        <li key={attempt.number}>
                            <details className="rounded border bg-background/60 p-2">
                                <summary className="cursor-pointer text-xs font-medium">
                                    Attempt {attempt.number} ·{" "}
                                    {attempt.passed ? "Passed" : "Failed"} ·{" "}
                                    {checkSummary(attempt)}
                                </summary>
                                <div className="mt-2 space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        {attempt.complete ? "Complete" : "Incomplete"}
                                        {pending.length > 0
                                            ? ` · Pending: ${pending.join(", ")}`
                                            : ""}
                                    </p>
                                    <EvidenceDetails
                                        summary={`Checks (${checks.length})`}
                                        value={checks}
                                        variant="structured"
                                    />
                                    <EvidenceDetails
                                        summary="Candidate"
                                        value={attempt.candidate}
                                        variant="structured"
                                    />
                                </div>
                            </details>
                        </li>
                    );
                })}
            </ol>
        </details>
    );
}
