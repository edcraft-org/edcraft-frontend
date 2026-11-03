import { AlertCircle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { AuthoringCheck } from "../types";
import { checkLabel, statusLabel } from "../getApprovalBlockers";

function CheckRow({ check }: { check: AuthoringCheck }) {
    const findings = check.findings ?? [];
    const StatusIcon =
        check.status === "passed"
            ? CheckCircle2
            : check.status === "failed"
              ? XCircle
              : check.status === "skipped"
                ? MinusCircle
                : AlertCircle;

    return (
        <li className="flex gap-3 rounded-md border p-3">
            <StatusIcon
                aria-hidden="true"
                className={
                    check.status === "passed"
                        ? "mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        : check.status === "failed" || check.status === "error"
                          ? "mt-0.5 h-4 w-4 shrink-0 text-destructive"
                          : "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                }
            />
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{checkLabel(check)}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                        {statusLabel(check.status)}
                    </span>
                </div>
                {check.error && <p className="text-sm text-destructive">{check.error}</p>}
                {findings.length > 0 && (
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        {findings.map((finding) => (
                            <li key={`${finding.code}-${finding.field ?? ""}-${finding.message}`}>
                                {finding.message}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
}

interface ChecksPanelProps {
    checks: AuthoringCheck[];
}

export function ChecksPanel({ checks }: ChecksPanelProps) {
    const technical = checks.filter((check) => !check.advisory);

    return (
        <section aria-labelledby="technical-checks-heading" className="space-y-2">
            <div>
                <h3 id="technical-checks-heading" className="font-medium">
                    Technical checks
                </h3>
                <p className="text-xs text-muted-foreground">
                    These checks must pass before you can approve. They can catch some problems,
                    but they cannot prove the question is correct.
                </p>
            </div>
            {technical.length === 0 ? (
                <p className="text-sm text-muted-foreground">No technical checks were recorded.</p>
            ) : (
                <ul className="space-y-2">
                    {technical.map((check) => (
                        <CheckRow key={check.tool} check={check} />
                    ))}
                </ul>
            )}
        </section>
    );
}
