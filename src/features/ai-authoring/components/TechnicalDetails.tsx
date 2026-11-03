import type { AuthoringResult, AuthoringReview } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";

interface TechnicalDetailsProps {
    review: AuthoringReview;
    result: AuthoringResult | null;
}

function present(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === "") return null;
    return String(value);
}

/**
 * Optional developer/research evidence. The default review keeps this closed so
 * educators can approve from the question and concise checks alone. Complex
 * payloads use one shared JSON disclosure instead of bespoke layouts.
 */
export function TechnicalDetails({ review, result }: TechnicalDetailsProps) {
    const metadata = [
        ["Artifact ID", review.artifact_id],
        ["Artifact digest (SHA-256)", review.artifact_sha256],
        ["Library revision", review.library_revision],
        ["Model profile", review.request.model_profile],
        ["Author provider", result?.provider],
        ["Author model", result?.model],
        ["Review state", review.state],
    ]
        .map(([label, value]) => [label, present(value)] as const)
        .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

    const checks = review.checks ?? [];
    const attempts = review.attempts ?? [];
    const evidence: Array<[string, unknown]> = [
        [`Automated checks (${checks.length})`, checks],
        [`Authoring attempts (${attempts.length})`, attempts],
        ["Fixed plan", review.fixed_plan ?? []],
        ["Difficulty advisory", review.difficulty ?? result?.difficulty],
        ["Relevance advisory", review.relevance ?? result?.relevance],
        ["Sampled-check limits", review.validation_limits ?? null],
        ["Raw warnings", review.warnings ?? []],
        ["Approval record", review.approval],
        ["Review error", review.error],
        ["Technically checked template artifact", review.template],
    ];

    return (
        <details className="rounded-lg border bg-muted/30 p-4 text-sm">
            <summary className="cursor-pointer font-medium">Technical details</summary>
            <div className="mt-4 space-y-3">
                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                    {metadata.map(([label, value]) => (
                        <div key={label}>
                            <dt className="font-medium text-muted-foreground">{label}</dt>
                            <dd className="break-all font-mono">{value}</dd>
                        </div>
                    ))}
                </dl>

                {review.candidate_is_historical_attempt && (
                    <p className="text-xs text-muted-foreground">
                        Candidates in the authoring attempts are historical. The checked template
                        and seeded preview show the version being reviewed.
                    </p>
                )}
                {evidence.map(([summary, value]) => (
                    <EvidenceDetails key={summary} summary={summary} value={value} />
                ))}
            </div>
        </details>
    );
}
