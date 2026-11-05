import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalize, modelLabel } from "../format";
import { filterActionableWarnings } from "../warnings";
import { getApprovalBlockers, isApproved } from "../getApprovalBlockers";
import { getReviewStatus } from "../status";
import type {
    AuthoringDifficultyOutcome,
    AuthoringRelevanceOutcome,
    AuthoringResult,
    AuthoringReview,
    ReviewTemplate,
} from "../types";
import { ApprovalControls } from "./ApprovalControls";
import { ChecksPanel } from "./ChecksPanel";
import { ReviewQuestionPreview } from "./ReviewQuestionPreview";
import { TechnicalDetails } from "./TechnicalDetails";
import { TemplateQuestionPreview } from "./TemplateQuestionPreview";
import { WarningsPanel } from "./WarningsPanel";

interface ReviewPanelProps {
    jobId: string;
    review: AuthoringReview;
    result: AuthoringResult | null;
    onStaleArtifact: () => void;
}

function AdvisoryCard({
    title,
    tone = "neutral",
    children,
}: {
    title: string;
    tone?: "amber" | "neutral";
    children: ReactNode;
}) {
    return (
        <div
            data-advisory={tone === "amber" ? "true" : undefined}
            className={
                tone === "amber"
                    ? "space-y-1 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20"
                    : "space-y-1 rounded-md border bg-muted/30 p-3 text-sm"
            }
        >
            <p className="flex items-center gap-2 font-medium">
                {tone === "amber" && (
                    <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                )}
                {title}
            </p>
            {children}
        </div>
    );
}

const ASSESSMENT_PATH_LABELS: Record<string, string> = {
    decision: "Decision screen",
    reasoning: "Reasoning judge",
};

function assessmentPathLabel(path: string | null | undefined): string | null {
    if (!path) return null;
    return ASSESSMENT_PATH_LABELS[path] ?? path;
}

function clampPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
}

function AdvisoryMeter({
    label,
    display,
    percent,
    tone,
    caption,
}: {
    label: string;
    display: string;
    percent: number;
    tone: "amber" | "neutral";
    caption?: string | null;
}) {
    return (
        <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{display}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                    className={
                        tone === "amber"
                            ? "h-full rounded-full bg-amber-500"
                            : "h-full rounded-full bg-green-600"
                    }
                    style={{ width: `${clampPercent(percent)}%` }}
                />
            </div>
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
        </div>
    );
}

function difficultyAdvisory(outcome: AuthoringDifficultyOutcome | null | undefined) {
    const confidence = outcome?.confidence ?? null;
    const assessmentPath = assessmentPathLabel(outcome?.assessment_path);

    if (
        !outcome ||
        !outcome.estimated_difficulty ||
        outcome.decision === "unavailable" ||
        outcome.status === "error"
    ) {
        return {
            title: "Difficulty not checked",
            tone: "neutral" as const,
            text: "No estimate available.",
            confidence,
            assessmentPath,
        };
    }

    const estimated = outcome.estimated_difficulty.toLowerCase();
    const requested = outcome.requested_difficulty?.toLowerCase();
    const differs =
        outcome.decision === "advisory_mismatch" ||
        (requested !== undefined && estimated !== requested);

    if (differs) {
        return {
            title: "Difficulty differs",
            tone: "amber" as const,
            text: requested
                ? `Estimated ${estimated}; requested ${requested}.`
                : `Estimated ${estimated}.`,
            confidence,
            assessmentPath,
        };
    }

    return {
        title: "Difficulty matches",
        tone: "neutral" as const,
        text: `Estimated ${estimated}.`,
        confidence,
        assessmentPath,
    };
}

function relevanceAdvisory(outcome: AuthoringRelevanceOutcome | null | undefined) {
    const score = outcome?.score ?? null;
    const threshold = outcome?.threshold ?? null;

    if (outcome?.relevant === true) {
        return {
            title: "Relevance looks good",
            tone: "neutral" as const,
            text: "Related to the request.",
            score,
            threshold,
        };
    }
    if (outcome?.relevant === false) {
        return {
            title: "Potential relevance mismatch",
            tone: "amber" as const,
            text: "May not match the request.",
            score,
            threshold,
        };
    }
    return {
        title: "Relevance not checked",
        tone: "neutral" as const,
        text: "No judgement available.",
        score,
        threshold,
    };
}

function RequestSection({ review }: { review: AuthoringReview }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm">{review.request.prompt}</p>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{capitalize(review.request.difficulty)}</Badge>
                    <Badge variant="outline">
                        {review.request.num_distractors + 1} choices
                    </Badge>
                    <Badge variant="outline">Model: {modelLabel(review.request)}</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function TemplateSection({
    template,
    draft = false,
}: {
    template: ReviewTemplate | null | undefined;
    draft?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Template</CardTitle>
                    {template && (
                        <Badge variant={draft ? "destructive" : "outline"}>
                            {draft ? "Draft · checks failed" : capitalize(template.language ?? "python")}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {draft && (
                    <p className="text-sm text-muted-foreground">
                        This draft did not pass technical checks. Inspect it, then retry with a
                        revised request or another model.
                    </p>
                )}
                {!template ? (
                    <p className="text-sm text-muted-foreground">
                        A template appears after the question passes its technical checks.
                    </p>
                ) : (
                    <TemplateQuestionPreview template={template} />
                )}
            </CardContent>
        </Card>
    );
}

export function ReviewPanel({ jobId, review, result, onStaleArtifact }: ReviewPanelProps) {
    const blockers = getApprovalBlockers(review);
    const canApprove = blockers.length === 0;
    const difficulty = review.difficulty ?? result?.difficulty;
    const relevance = review.relevance ?? result?.relevance;
    const difficultyFeedback = difficultyAdvisory(difficulty);
    const relevanceFeedback = relevanceAdvisory(relevance);
    const status = getReviewStatus(review, result);
    const draftTemplate: ReviewTemplate | null =
        review.template ??
        (review.candidate
            ? {
                  template_id: review.candidate.template_id,
                  candidate: review.candidate,
                  language: "python",
              }
            : null);
    const showingDraft = !review.template && Boolean(review.candidate);

    return (
        <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
                <WarningsPanel
                    warnings={filterActionableWarnings(review.warnings, {
                        approved: isApproved(review),
                    })}
                />
                <RequestSection review={review} />
                <TemplateSection template={draftTemplate} draft={showingDraft} />
                <ReviewQuestionPreview
                    jobId={jobId}
                    artifactSha256={review.artifact_sha256}
                    onStaleArtifact={onStaleArtifact}
                />
                <TechnicalDetails review={review} result={result} />
            </div>

            <aside className="space-y-4 xl:col-span-4">
                <div className="space-y-4 xl:sticky xl:top-6">
                    <Card>
                        <CardContent className="pt-6">
                            <ApprovalControls
                                jobId={jobId}
                                review={review}
                                blockers={blockers}
                                canApprove={canApprove}
                                onStaleArtifact={onStaleArtifact}
                            />

                            {review.error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Review problem</AlertTitle>
                                    <AlertDescription>
                                        Create a new question if this persists.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="gap-2 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="leading-none font-semibold">Technical checks</h3>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{status.summary}</p>
                            <p className="text-xs text-muted-foreground">
                                Artifact{" "}
                                <span
                                    className="break-all font-mono"
                                    title={review.artifact_sha256 ?? undefined}
                                >
                                    {review.artifact_id ?? "pending"}
                                    {review.artifact_sha256
                                        ? ` · ${review.artifact_sha256.slice(0, 8)}`
                                        : ""}
                                </span>
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ChecksPanel checks={review.checks ?? []} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Advisories</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Advisories never block approval.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <AdvisoryCard
                                title={difficultyFeedback.title}
                                tone={difficultyFeedback.tone}
                            >
                                <p className="text-muted-foreground">{difficultyFeedback.text}</p>
                                {difficultyFeedback.confidence !== null && (
                                    <AdvisoryMeter
                                        label="Confidence"
                                        display={`${Math.round(difficultyFeedback.confidence * 100)}%`}
                                        percent={difficultyFeedback.confidence * 100}
                                        tone={difficultyFeedback.tone}
                                        caption={
                                            difficultyFeedback.assessmentPath
                                                ? `Source: ${difficultyFeedback.assessmentPath}`
                                                : null
                                        }
                                    />
                                )}
                            </AdvisoryCard>
                            <AdvisoryCard
                                title={relevanceFeedback.title}
                                tone={relevanceFeedback.tone}
                            >
                                <p className="text-muted-foreground">{relevanceFeedback.text}</p>
                                {relevanceFeedback.score !== null && (
                                    <AdvisoryMeter
                                        label="Score"
                                        display={relevanceFeedback.score.toFixed(2)}
                                        percent={relevanceFeedback.score * 100}
                                        tone={relevanceFeedback.tone}
                                        caption={
                                            relevanceFeedback.threshold !== null
                                                ? `Threshold ${relevanceFeedback.threshold.toFixed(2)}`
                                                : null
                                        }
                                    />
                                )}
                            </AdvisoryCard>
                        </CardContent>
                    </Card>
                </div>
            </aside>
        </div>
    );
}
