import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AuthoringCheck } from "../types";
import { checkLabel, statusLabel } from "../getApprovalBlockers";

interface ChecksPanelProps {
    checks: AuthoringCheck[];
}

/**
 * Concise default summary. Tool identifiers and individual findings are only
 * shown in Technical details so reviewers can act on the overall result first.
 */
export function ChecksPanel({ checks }: ChecksPanelProps) {
    const technical = checks.filter((check) => !check.advisory);
    const needsAttention = technical.filter((check) => check.status !== "passed");

    return (
        <section aria-labelledby="technical-checks-heading" className="space-y-2">
            <h3 id="technical-checks-heading" className="font-medium">
                Technical checks
            </h3>
            {technical.length === 0 ? (
                <p className="text-sm text-muted-foreground">No technical checks were recorded.</p>
            ) : needsAttention.length === 0 ? (
                <p className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                    <span>
                        All {technical.length} technical checks passed. They cannot prove the
                        question is correct.
                    </span>
                </p>
            ) : (
                <div className="space-y-1 rounded-md border border-destructive/40 p-3 text-sm">
                    <p className="flex items-start gap-2 font-medium">
                        <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                            aria-hidden="true"
                        />
                        {needsAttention.length} of {technical.length} technical checks need
                        attention.
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                        {needsAttention.map((check) => (
                            <li key={check.tool}>
                                {checkLabel(check)}: {statusLabel(check.status)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
