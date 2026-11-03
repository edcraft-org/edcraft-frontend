import { useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";
import { capitalize, formatDate } from "../format";
import { getApprovalBlockers } from "../getApprovalBlockers";
import { useAuthoringPreview, useDecideAuthoringApproval } from "../hooks/useAiAuthoring";
import type {
    ApprovalDecision,
    AuthoringResult,
    AuthoringReview,
    AuthoringDifficultyOutcome,
    AuthoringRelevanceOutcome,
    ValidationLimits,
} from "../types";
import { MAX_SEED, seedError as validateSeed } from "../validation";
import { ChecksPanel } from "./ChecksPanel";
import { EvidenceDetails } from "./EvidenceDetails";
import { PreviewQuestion } from "./PreviewQuestion";
import { TemplateArtifact } from "./TemplateArtifact";

function formatScore(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function relevanceVerdict(relevance: AuthoringRelevanceOutcome): string {
    if (relevance.relevant === true) return "Relevant";
    if (relevance.relevant === false) return "Not relevant";
    return "Unavailable";
}

function DifficultyOutcomeSummary({
    outcome,
}: {
    outcome: AuthoringDifficultyOutcome | null | undefined;
}) {
    if (!outcome) {
        return (
            <p className="text-sm text-muted-foreground">
                Difficulty estimate unavailable. This is advisory only.
            </p>
        );
    }
    return (
        <div className="space-y-1 text-sm">
            <p>
                Estimated difficulty:{" "}
                <span className="font-medium">
                    {outcome.estimated_difficulty
                        ? capitalize(outcome.estimated_difficulty)
                        : "Unavailable"}
                </span>
            </p>
            <p className="text-muted-foreground">
                Advisory decision: {(outcome.decision ?? "unavailable").replaceAll("_", " ")}.
                Difficulty assessments never block approval.
            </p>
            {typeof outcome.confidence === "number" && (
                <p className="text-xs text-muted-foreground">
                    Advisory estimate confidence {formatScore(outcome.confidence)}
                    {outcome.confidence_source
                        ? ` (${outcome.confidence_source.replaceAll("_", " ")})`
                        : ""}
                    . This is not a probability that an answer is correct.
                </p>
            )}
            {outcome.reason && <p className="text-muted-foreground">{outcome.reason}</p>}
        </div>
    );
}

function ValidationLimitsSummary({ limits }: { limits: ValidationLimits | null }) {
    if (!limits) {
        return <p className="text-sm text-muted-foreground">No sampled-check limits recorded.</p>;
    }
    return (
        <dl className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
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
                <dd>{limits.seed}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Mode</dt>
                <dd>{limits.checking_mode.replaceAll("_", " ")}</dd>
            </div>
            <div>
                <dt className="text-xs font-medium text-muted-foreground">Validator</dt>
                <dd>{limits.validator_version}</dd>
            </div>
        </dl>
    );
}

interface ReviewPanelProps {
    jobId: string;
    review: AuthoringReview;
    result: AuthoringResult | null;
    onStaleArtifact: () => void;
}

export function ReviewPanel({ jobId, review, result, onStaleArtifact }: ReviewPanelProps) {
    const [note, setNote] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);
    const [seedInput, setSeedInput] = useState("0");
    const [previewSeed, setPreviewSeed] = useState(0);
    const [seedError, setSeedError] = useState<string | null>(null);

    const blockers = getApprovalBlockers(review);
    const canApprove = blockers.length === 0;
    const approval = review.approval;
    const difficulty = review.difficulty ?? result?.difficulty;
    const relevance = review.relevance ?? result?.relevance;

    const previewQuery = useAuthoringPreview(jobId, review.artifact_sha256, previewSeed);
    const approvalMutation = useDecideAuthoringApproval();

    const decide = (decision: ApprovalDecision) => {
        if (!review.artifact_sha256 || !canApprove || approvalMutation.isPending) return;
        setActionError(null);
        approvalMutation.mutate(
            {
                jobId,
                input: {
                    artifact_sha256: review.artifact_sha256,
                    decision,
                    note: note.trim() ? note.trim() : null,
                },
            },
            {
                onError: (error) => {
                    if (isStaleArtifactError(error)) {
                        onStaleArtifact();
                    }
                    setActionError(
                        getAuthoringErrorMessage(
                            error,
                            "The approval decision could not be saved.",
                        ),
                    );
                },
            },
        );
    };

    const loadPreviewSeed = () => {
        if (!seedInput.trim()) {
            setSeedError(`Enter a seed from 0 to ${MAX_SEED}.`);
            return;
        }
        const parsed = Number(seedInput);
        const error = validateSeed(parsed);
        if (error) {
            setSeedError(error);
            return;
        }
        setSeedError(null);
        if (parsed === previewSeed) {
            void previewQuery.refetch();
        } else {
            setPreviewSeed(parsed);
        }
    };

    return (
        <Card>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Review authoring result</CardTitle>
                    {approval ? (
                        <Badge
                            variant={approval.decision === "approved" ? "default" : "destructive"}
                        >
                            {capitalize(approval.decision)}
                        </Badge>
                    ) : (
                        <Badge variant="outline">Unreviewed</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <section aria-labelledby="request-heading" className="space-y-2">
                    <h3 id="request-heading" className="font-medium">
                        Original request
                    </h3>
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                        {review.request.prompt}
                    </p>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Domain</dt>
                            <dd>{capitalize(review.request.domain)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                                Requested difficulty
                            </dt>
                            <dd>{capitalize(review.request.difficulty)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                                Distractors
                            </dt>
                            <dd>{review.request.num_distractors}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                                Model profile
                            </dt>
                            <dd className="break-all font-mono text-xs">
                                {review.request.model_profile}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                                Author provider
                            </dt>
                            <dd>{result?.provider ?? "Not reported"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">
                                Author model
                            </dt>
                            <dd className="break-all font-mono text-xs">
                                {result?.model ?? "Not reported"}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section aria-labelledby="difficulty-heading" className="space-y-1">
                    <h3 id="difficulty-heading" className="font-medium">
                        Difficulty assessment
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Advisory information, not a probability that an answer is correct.
                    </p>
                    <DifficultyOutcomeSummary outcome={difficulty} />
                    {relevance && (
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                                Relevance advisory:{" "}
                                <span className="font-medium text-foreground">
                                    {relevanceVerdict(relevance)}
                                </span>
                                {relevance.reason ? ` — ${relevance.reason}` : ""}
                            </p>
                            {typeof relevance.score === "number" &&
                                typeof relevance.threshold === "number" && (
                                    <p className="text-xs">
                                        Advisory score {formatScore(relevance.score)} (threshold{" "}
                                        {formatScore(relevance.threshold)}). This is a judge score,
                                        not a probability that an answer is correct.
                                    </p>
                                )}
                        </div>
                    )}
                </section>

                <ChecksPanel checks={review.checks ?? []} />

                {(review.warnings ?? []).length > 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Authoring warnings</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc space-y-1 pl-4">
                                {(review.warnings ?? []).map((warning) => (
                                    <li key={warning}>{warning}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {review.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Review error</AlertTitle>
                        <AlertDescription>{review.error.message}</AlertDescription>
                    </Alert>
                )}

                <section aria-labelledby="evidence-heading" className="space-y-2">
                    <h3 id="evidence-heading" className="font-medium">
                        Checking evidence
                    </h3>
                    <EvidenceDetails
                        summary={`Authoring attempts (${(review.attempts ?? []).length})`}
                        value={review.attempts ?? []}
                    />
                    {review.candidate_is_historical_attempt && (
                        <p className="text-xs text-muted-foreground">
                            The displayed candidate is a historical attempt, not the selected
                            checked artifact. Compare it with the attempts above before approving.
                        </p>
                    )}
                    <EvidenceDetails summary="Fixed plan" value={review.fixed_plan ?? []} />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Sampled-check limits</h4>
                        <ValidationLimitsSummary limits={review.validation_limits ?? null} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Library revision:{" "}
                        <span className="font-mono">{review.library_revision}</span>
                    </p>
                    {review.template && <TemplateArtifact template={review.template} />}
                </section>

                <section aria-labelledby="preview-heading" className="space-y-3">
                    <div>
                        <h3 id="preview-heading" className="font-medium">
                            Deterministic preview
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Preview generation is a local, seeded expansion of the checked artifact.
                            It does not run a model or execute user code.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="preview-seed">Preview seed</Label>
                            <Input
                                id="preview-seed"
                                type="number"
                                step={1}
                                value={seedInput}
                                onChange={(event) => setSeedInput(event.target.value)}
                                className="w-40"
                                aria-invalid={Boolean(seedError)}
                                aria-describedby={seedError ? "preview-seed-error" : undefined}
                            />
                            {seedError && (
                                <p id="preview-seed-error" className="text-sm text-destructive">
                                    {seedError}
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={loadPreviewSeed}
                            disabled={!review.artifact_sha256}
                        >
                            Load preview
                        </Button>
                    </div>

                    {!review.artifact_sha256 && (
                        <p className="text-sm text-muted-foreground">
                            A preview is available only after a checked artifact is produced.
                        </p>
                    )}
                    {previewQuery.isPending && review.artifact_sha256 && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Loading seeded preview…
                        </p>
                    )}
                    {previewQuery.isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Preview failed</AlertTitle>
                            <AlertDescription className="space-y-2">
                                <p>
                                    {getAuthoringErrorMessage(
                                        previewQuery.error,
                                        "The seeded preview could not be loaded.",
                                    )}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void previewQuery.refetch()}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Retry preview
                                    </Button>
                                    {isStaleArtifactError(previewQuery.error) && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={onStaleArtifact}
                                        >
                                            Refresh review
                                        </Button>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    {previewQuery.data && (
                        <PreviewQuestion instance={previewQuery.data.question} />
                    )}
                </section>

                <section aria-labelledby="approval-heading" className="space-y-3 border-t pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 id="approval-heading" className="font-medium">
                            Approval
                        </h3>
                        <span className="break-all font-mono text-xs text-muted-foreground">
                            SHA-256 {review.artifact_sha256 ?? "unavailable"}
                        </span>
                    </div>

                    {approval && (
                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                            <p>
                                {capitalize(approval.decision)} by {approval.reviewer} on{" "}
                                {formatDate(approval.decided_at)}
                            </p>
                            {approval.note && <p className="mt-1">Note: {approval.note}</p>}
                            {approval.decision === "rejected" && (
                                <p className="mt-1 text-muted-foreground">
                                    A rejected artifact cannot be generated. An explicit approval
                                    of the same artifact digest can replace this decision when the
                                    server allows it.
                                </p>
                            )}
                        </div>
                    )}

                    {blockers.length > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Approval unavailable</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc space-y-1 pl-4">
                                    {blockers.map((blocker) => (
                                        <li key={blocker}>{blocker}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="approval-note">Review note (optional)</Label>
                        <Textarea
                            id="approval-note"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Explain the decision for later reviewers."
                            maxLength={2000}
                            rows={3}
                        />
                    </div>

                    {actionError && (
                        <Alert variant="destructive" role="alert">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Decision not saved</AlertTitle>
                            <AlertDescription>{actionError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={() => decide("approved")}
                            disabled={!canApprove || approvalMutation.isPending}
                        >
                            {approvalMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            )}
                            {approval?.decision === "approved"
                                ? "Re-approve this artifact"
                                : "Approve artifact"}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => decide("rejected")}
                            disabled={!canApprove || approvalMutation.isPending}
                        >
                            {approval?.decision === "rejected"
                                ? "Confirm rejection"
                                : "Reject artifact"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        The decision is bound to the exact artifact digest shown above. Advisory
                        findings do not prevent approval.
                    </p>
                </section>
            </CardContent>
        </Card>
    );
}
