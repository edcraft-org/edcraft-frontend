import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalize } from "../format";
import { getApprovalBlockers } from "../getApprovalBlockers";
import type {
    AuthoringDifficultyOutcome,
    AuthoringRelevanceOutcome,
    AuthoringResult,
    AuthoringReview,
} from "../types";
import { ApprovalControls } from "./ApprovalControls";
import { ChecksPanel } from "./ChecksPanel";
import { ReviewQuestionPreview } from "./ReviewQuestionPreview";
import { TechnicalDetails } from "./TechnicalDetails";

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

function difficultyAdvisory(outcome: AuthoringDifficultyOutcome | null | undefined) {
    if (
        !outcome ||
        !outcome.estimated_difficulty ||
        outcome.decision === "unavailable" ||
        outcome.status === "error"
    ) {
        return {
            title: "Difficulty was not checked",
            tone: "neutral" as const,
            text: "No difficulty estimate was available.",
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
                ? `The model estimated ${estimated}; you asked for ${requested}.`
                : `The model estimated ${estimated}.`,
        };
    }

    return {
        title: "Difficulty matches your request",
        tone: "neutral" as const,
        text: `The model estimated ${estimated}, matching your request.`,
    };
}

function relevanceAdvisory(outcome: AuthoringRelevanceOutcome | null | undefined) {
    if (outcome?.relevant === true) {
        return {
            title: "Relevance looks good",
            tone: "neutral" as const,
            text: "The review model judged this question related to your request.",
        };
    }
    if (outcome?.relevant === false) {
        return {
            title: "Potential relevance mismatch",
            tone: "amber" as const,
            text: "The review model was not sure this question matches your request.",
        };
    }
    return {
        title: "Relevance was not checked",
        tone: "neutral" as const,
        text: "No relevance judgement was available.",
    };
}

export function ReviewPanel({ jobId, review, result, onStaleArtifact }: ReviewPanelProps) {
    const blockers = getApprovalBlockers(review);
    const canApprove = blockers.length === 0;
    const difficulty = review.difficulty ?? result?.difficulty;
    const relevance = review.relevance ?? result?.relevance;
    const difficultyFeedback = difficultyAdvisory(difficulty);
    const relevanceFeedback = relevanceAdvisory(relevance);

    return (
        <Card>
            <CardHeader className="gap-2">
                <div>
                    <CardTitle>Review question</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Check the question and its technical checks, then approve or reject this
                        version.
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="order-2 space-y-6 lg:order-1">
                        <section aria-labelledby="request-heading" className="space-y-2">
                            <h3 id="request-heading" className="font-medium">
                                Your request
                            </h3>
                            <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                                {review.request.prompt}
                            </p>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">
                                        Difficulty
                                    </dt>
                                    <dd>{capitalize(review.request.difficulty)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">
                                        Answer choices
                                    </dt>
                                    <dd>{review.request.num_distractors + 1} choices</dd>
                                </div>
                            </dl>
                            <p className="text-xs text-muted-foreground">
                                Multiple choice with one correct answer. Automated checks catch some
                                problems; they cannot prove the question is correct.
                            </p>
                        </section>

                        <section aria-labelledby="feedback-heading" className="space-y-2">
                            <div>
                                <h3 id="feedback-heading" className="font-medium">
                                    Review feedback
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Difficulty and relevance notes are advisory and never block
                                    approval. Technical details has the full evidence.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <AdvisoryCard title={difficultyFeedback.title} tone={difficultyFeedback.tone}>
                                    <p className="text-muted-foreground">{difficultyFeedback.text}</p>
                                </AdvisoryCard>
                                <AdvisoryCard title={relevanceFeedback.title} tone={relevanceFeedback.tone}>
                                    <p className="text-muted-foreground">{relevanceFeedback.text}</p>
                                </AdvisoryCard>
                            </div>
                        </section>

                        <ChecksPanel checks={review.checks ?? []} />

                        <ApprovalControls
                            jobId={jobId}
                            review={review}
                            blockers={blockers}
                            canApprove={canApprove}
                            onStaleArtifact={onStaleArtifact}
                        />

                        {review.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Review problem</AlertTitle>
                                <AlertDescription>
                                    The review reported a problem. Create a new question if this
                                    persists.
                                </AlertDescription>
                            </Alert>
                        )}

                        <TechnicalDetails review={review} result={result} />
                    </div>

                    <div className="order-1 space-y-6 lg:order-2">
                        <ReviewQuestionPreview
                            jobId={jobId}
                            artifactSha256={review.artifact_sha256}
                            onStaleArtifact={onStaleArtifact}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
