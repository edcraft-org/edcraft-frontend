import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AuthoringCheck } from "../types";
import { checkDescription, checkLabel, statusLabel } from "../checkMetadata";

interface ChecksPanelProps {
    checks: AuthoringCheck[];
}

/**
 * Lists every technical check with a plain-language description of what it
 * verifies. The summary only counts results; it makes no claim about whether
 * the question itself is correct.
 */
export function ChecksPanel({ checks }: ChecksPanelProps) {
    const technical = checks.filter((check) => !check.advisory);
    const needsAttention = technical.filter((check) => check.status !== "passed");

    const summary =
        technical.length === 0
            ? "No technical checks were recorded."
            : needsAttention.length === 0
              ? `All ${technical.length} technical checks passed.`
              : `${needsAttention.length} of ${technical.length} technical checks need attention.`;

    return (
        <section aria-label="Technical checks" className="space-y-3">
            <p className="text-sm font-medium">{summary}</p>
            {technical.length > 0 && (
                <ul className="space-y-3">
                    {technical.map((check, index) => {
                        const passed = check.status === "passed";
                        const description = checkDescription(check);
                        const findings = check.findings ?? [];

                        return (
                            <li
                                key={`${check.tool}-${index}`}
                                className="flex items-start gap-2"
                            >
                                {passed ? (
                                    <CheckCircle2
                                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <AlertCircle
                                        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-medium">
                                        <span className="sr-only">
                                            {statusLabel(check.status)}:{" "}
                                        </span>
                                        {checkLabel(check)}
                                    </p>
                                    {description && (
                                        <p className="text-xs text-muted-foreground">
                                            {description}
                                        </p>
                                    )}
                                    {!passed && check.error && (
                                        <p className="text-xs text-destructive">{check.error}</p>
                                    )}
                                    {!passed &&
                                        findings.map((finding, findingIndex) => (
                                            <p
                                                key={`${finding.code}-${findingIndex}`}
                                                className="text-xs text-muted-foreground"
                                            >
                                                {finding.message}
                                            </p>
                                        ))}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
