import { formatDate, formatScore } from "../format";
import type { AuthoringResult, AuthoringReview, ValidationLimits } from "../types";
import { EvidenceDetails } from "./EvidenceDetails";
import { TemplateArtifact } from "./TemplateArtifact";

function notReported(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === "") return "Not reported";
    return String(value);
}

function ValidationLimitsSummary({ limits }: { limits: ValidationLimits | null }) {
    if (!limits) {
        return <p className="text-sm text-muted-foreground">No sampled-check limits recorded.</p>;
    }
    return (
        <dl className="grid gap-3 rounded-md border bg-background p-3 text-sm sm:grid-cols-2">
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Examples checked</dt>
                <dd>
                    {limits.examples_checked} of {limits.max_examples}
                </dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Execution calls</dt>
                <dd>
                    {limits.execution_calls} of {limits.max_execution_calls}
                </dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Check timeout</dt>
                <dd>{limits.timeout_seconds}s</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Validation seed</dt>
                <dd className="font-mono">{limits.seed}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Mode</dt>
                <dd>{limits.checking_mode.replaceAll("_", " ")}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Validator</dt>
                <dd className="break-all font-mono text-xs">{limits.validator_version}</dd>
            </div>
        </dl>
    );
}

interface TechnicalDetailsProps {
    review: AuthoringReview;
    result: AuthoringResult | null;
}

/**
 * Optional developer/research evidence. The default review keeps this closed so
 * educators can approve from the question and plain-language checks alone.
 */
export function TechnicalDetails({ review, result }: TechnicalDetailsProps) {
    const checks = review.checks ?? [];
    const warnings = review.warnings ?? [];
    const attempts = review.attempts ?? [];
    const fixedPlan = review.fixed_plan ?? [];
    const difficulty = review.difficulty ?? result?.difficulty;
    const relevance = review.relevance ?? result?.relevance;
    const approval = review.approval;

    return (
        <details className="rounded-lg border bg-muted/30 p-4 text-sm">
            <summary className="cursor-pointer font-medium">Technical details</summary>
            <div className="mt-4 space-y-5">
                <section className="space-y-2" aria-labelledby="technical-identifiers">
                    <h4 id="technical-identifiers" className="text-sm font-medium">
                        Question identifiers
                    </h4>
                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-muted-foreground">Artifact ID</dt>
                            <dd className="break-all font-mono">
                                {notReported(review.artifact_id)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Artifact digest (SHA-256)
                            </dt>
                            <dd className="break-all font-mono">
                                {notReported(review.artifact_sha256)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Library revision</dt>
                            <dd className="break-all font-mono">
                                {notReported(review.library_revision)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Model profile</dt>
                            <dd className="break-all font-mono">
                                {notReported(review.request.model_profile)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Author provider</dt>
                            <dd className="break-all">{notReported(result?.provider)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Author model</dt>
                            <dd className="break-all font-mono">{notReported(result?.model)}</dd>
                        </div>
                    </dl>
                </section>

                <section className="space-y-2" aria-labelledby="technical-approval">
                    <h4 id="technical-approval" className="text-sm font-medium">
                        Exact approval metadata
                    </h4>
                    {approval ? (
                        <dl className="grid gap-3 text-xs sm:grid-cols-2">
                            <div>
                                <dt className="font-medium text-muted-foreground">Decision</dt>
                                <dd>{approval.decision}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-muted-foreground">Reviewer</dt>
                                <dd className="break-all">{approval.reviewer}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-muted-foreground">Decided</dt>
                                <dd>{formatDate(approval.decided_at)}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-muted-foreground">
                                    Approved artifact digest
                                </dt>
                                <dd className="break-all font-mono">{approval.artifact_sha256}</dd>
                            </div>
                            {approval.note && (
                                <div className="sm:col-span-2">
                                    <dt className="font-medium text-muted-foreground">Note</dt>
                                    <dd className="whitespace-pre-wrap">{approval.note}</dd>
                                </div>
                            )}
                        </dl>
                    ) : (
                        <p className="text-muted-foreground">No approval decision recorded.</p>
                    )}
                </section>

                <section className="space-y-2" aria-labelledby="technical-warnings">
                    <h4 id="technical-warnings" className="text-sm font-medium">
                        Raw warning codes
                    </h4>
                    {warnings.length === 0 ? (
                        <p className="text-muted-foreground">No warnings recorded.</p>
                    ) : (
                        <ul className="list-disc space-y-1 pl-4 font-mono text-xs">
                            {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-2" aria-labelledby="technical-checks">
                    <h4 id="technical-checks" className="text-sm font-medium">
                        Check identifiers and findings
                    </h4>
                    {checks.length === 0 ? (
                        <p className="text-muted-foreground">No checks recorded.</p>
                    ) : (
                        <ul className="space-y-2">
                            {checks.map((check) => (
                                <li key={check.tool} className="rounded-md border bg-background p-3">
                                    <p className="break-all font-mono text-xs">
                                        {check.tool} · {check.advisory ? "advisory" : "technical"} ·{" "}
                                        {check.status}
                                    </p>
                                    {check.error && (
                                        <p className="mt-1 text-xs text-destructive">{check.error}</p>
                                    )}
                                    {(check.findings ?? []).length > 0 && (
                                        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                                            {(check.findings ?? []).map((finding) => (
                                                <li
                                                    key={`${finding.code}-${finding.field ?? ""}-${finding.message}`}
                                                >
                                                    <span className="font-mono">{finding.code}</span>
                                                    {finding.field ? ` (${finding.field})` : ""}:{" "}
                                                    {finding.message}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-2" aria-labelledby="technical-advisories">
                    <h4 id="technical-advisories" className="text-sm font-medium">
                        Advisory evidence
                    </h4>
                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Difficulty decision
                            </dt>
                            <dd>{notReported(difficulty?.decision)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Estimated / requested difficulty
                            </dt>
                            <dd>
                                {notReported(difficulty?.estimated_difficulty)} /{" "}
                                {notReported(difficulty?.requested_difficulty)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Confidence score
                            </dt>
                            <dd>
                                {typeof difficulty?.confidence === "number"
                                    ? formatScore(difficulty.confidence)
                                    : "Not reported"}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Confidence source
                            </dt>
                            <dd>
                                {difficulty?.confidence_source
                                    ? difficulty.confidence_source.replaceAll("_", " ")
                                    : "Not reported"}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Relevance score</dt>
                            <dd>
                                {typeof relevance?.score === "number"
                                    ? formatScore(relevance.score)
                                    : "Not reported"}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Relevance threshold</dt>
                            <dd>
                                {typeof relevance?.threshold === "number"
                                    ? formatScore(relevance.threshold)
                                    : "Not reported"}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Difficulty error code
                            </dt>
                            <dd className="break-all font-mono">
                                {notReported(difficulty?.error_code)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">
                                Relevance error code
                            </dt>
                            <dd className="break-all font-mono">
                                {notReported(relevance?.error_code)}
                            </dd>
                        </div>
                    </dl>
                    {difficulty?.reason && (
                        <p className="text-xs text-muted-foreground">{difficulty.reason}</p>
                    )}
                    {relevance?.reason && (
                        <p className="text-xs text-muted-foreground">{relevance.reason}</p>
                    )}
                </section>

                <section className="space-y-2" aria-labelledby="technical-attempts">
                    <h4 id="technical-attempts" className="text-sm font-medium">
                        Authoring attempts and plan
                    </h4>
                    <EvidenceDetails
                        summary={`Authoring attempts (${attempts.length})`}
                        value={attempts}
                    />
                    {review.candidate_is_historical_attempt && (
                        <p className="text-xs text-muted-foreground">
                            Candidates in the authoring attempts are historical. The checked
                            template and seeded preview show the version being reviewed.
                        </p>
                    )}
                    <EvidenceDetails summary="Fixed plan" value={fixedPlan} />
                </section>

                <section className="space-y-2" aria-labelledby="technical-validation">
                    <h4 id="technical-validation" className="text-sm font-medium">
                        Sampled-check limits
                    </h4>
                    <ValidationLimitsSummary limits={review.validation_limits ?? null} />
                </section>

                {review.error && (
                    <section className="space-y-2">
                        <h4 className="text-sm font-medium">Review error</h4>
                        <EvidenceDetails summary="Raw review error" value={review.error} />
                    </section>
                )}

                {review.template && <TemplateArtifact template={review.template} />}
            </div>
        </details>
    );
}
