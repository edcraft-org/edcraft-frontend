import { AlertCircle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { AuthoringCheck } from "../types";
import { checkLabel, statusLabel } from "../getApprovalBlockers";

function CheckRow({ check }: { check: AuthoringCheck }) {
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
                        : check.status === "failed"
                          ? "mt-0.5 h-4 w-4 shrink-0 text-destructive"
                          : "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                }
            />
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium capitalize">{checkLabel(check)}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                        {statusLabel(check.status)}
                    </span>
                </div>
                {check.error && (
                    <p className="text-sm text-destructive">{check.error}</p>
                )}
                {check.findings.length > 0 && (
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        {check.findings.map((finding) => (
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
    const advisory = checks.filter((check) => check.advisory);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <section aria-labelledby="technical-checks-heading" className="space-y-2">
                <div>
                    <h3 id="technical-checks-heading" className="font-medium">
                        Technical checks
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        These checks gate whether the artifact can be approved.
                    </p>
                </div>
                {technical.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No technical checks recorded.</p>
                ) : (
                    <ul className="space-y-2">
                        {technical.map((check) => (
                            <CheckRow key={check.tool} check={check} />
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="advisory-checks-heading" className="space-y-2">
                <div>
                    <h3 id="advisory-checks-heading" className="font-medium">
                        Advisory review
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Difficulty, relevance and other advisory findings help a reviewer. They do
                        not block approval.
                    </p>
                </div>
                {advisory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No advisory findings recorded.</p>
                ) : (
                    <ul className="space-y-2">
                        {advisory.map((check) => (
                            <CheckRow key={check.tool} check={check} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
