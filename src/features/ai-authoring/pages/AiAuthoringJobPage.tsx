import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/api";
import { ROUTES } from "@/router/paths";
import { ProgressPanel } from "../components/ProgressPanel";
import { RetryPanel } from "../components/RetryPanel";
import { ReviewPanel } from "../components/ReviewPanel";
import { TechnicalDetails } from "../components/TechnicalDetails";
import { getAuthoringErrorMessage, isNotFoundError } from "../errors";
import {
    useAuthoringCapabilities,
    useAuthoringJob,
    useAuthoringReview,
} from "../hooks/useAiAuthoring";

function LoadingCard({ children }: { children: string }) {
    return (
        <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">{children}</CardContent>
        </Card>
    );
}

const STALE_ARTIFACT_MESSAGE =
    "The checked question changed. The latest review is being loaded and any old preview or generated questions were cleared.";

export default function AiAuthoringJobPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const queryClient = useQueryClient();
    const [reviewEpoch, setReviewEpoch] = useState(0);
    const [staleJobId, setStaleJobId] = useState<string | null>(null);

    const jobQuery = useAuthoringJob(jobId);
    const reviewTerminal =
        jobQuery.data?.state === "completed" || jobQuery.data?.state === "failed";
    const reviewQuery = useAuthoringReview(jobId, reviewTerminal);
    const capabilitiesQuery = useAuthoringCapabilities();

    const handleStaleArtifact = useCallback(() => {
        setStaleJobId(jobId ?? null);
        setReviewEpoch((epoch) => epoch + 1);
        if (!jobId) return;
        queryClient.removeQueries({ queryKey: queryKeys.aiAuthoring.previewRoot(jobId) });
        // The job key prefix also covers the review and preview child keys.
        void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.job(jobId) });
    }, [jobId, queryClient]);

    if (!jobId) {
        return (
            <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No question selected</AlertTitle>
                    <AlertDescription>
                        <Link className="underline underline-offset-2" to={ROUTES.AI_AUTHORING}>
                            Create a new question
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const job = jobQuery.data;
    const review = reviewQuery.data;
    const terminal = reviewTerminal;

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <Link
                        to={ROUTES.AI_AUTHORING}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        New request
                    </Link>
                    <h1 className="text-2xl font-semibold">AI Authoring</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {job?.state === "completed" && (
                        <Button asChild type="button" size="sm">
                            <Link to={ROUTES.AI_AUTHORING_GENERATE(jobId)}>
                                <Sparkles />
                                Reuse and generate
                            </Link>
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            void jobQuery.refetch();
                            if (terminal) void reviewQuery.refetch();
                        }}
                        disabled={jobQuery.isFetching}
                    >
                        <RefreshCw className={jobQuery.isFetching ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                </div>
            </div>

            {jobQuery.isPending && <LoadingCard>Loading your question…</LoadingCard>}

            {jobQuery.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        {isNotFoundError(jobQuery.error)
                            ? "Question not found"
                            : "Question could not be loaded"}
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            {getAuthoringErrorMessage(
                                jobQuery.error,
                                "The question could not be loaded.",
                            )}
                        </p>
                        {!isNotFoundError(jobQuery.error) && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void jobQuery.refetch()}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </Button>
                        )}
                        <p>
                            <Link className="underline underline-offset-2" to={ROUTES.AI_AUTHORING}>
                                Create a new question
                            </Link>
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {job && (
                <>
                    <ProgressPanel job={job} />

                    {staleJobId === jobId && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>The question changed</AlertTitle>
                            <AlertDescription className="space-y-2">
                                <p>{STALE_ARTIFACT_MESSAGE}</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setStaleJobId(null)}
                                >
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {job.state === "failed" && (
                        <>
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Question creation failed</AlertTitle>
                                <AlertDescription>
                                    {job.error?.message ??
                                        job.result?.error?.message ??
                                        review?.error?.message ??
                                        "The question could not be created."}
                                </AlertDescription>
                            </Alert>

                            {review?.request && capabilitiesQuery.isPending && (
                                <LoadingCard>Loading model settings…</LoadingCard>
                            )}

                            {review?.request && capabilitiesQuery.isError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Question settings unavailable</AlertTitle>
                                    <AlertDescription>
                                        {getAuthoringErrorMessage(
                                            capabilitiesQuery.error,
                                            "The question settings could not be loaded.",
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {review?.request && capabilitiesQuery.data && (
                                <RetryPanel
                                    request={review.request}
                                    capabilities={capabilitiesQuery.data}
                                />
                            )}

                            {review && !reviewQuery.isError && (
                                <TechnicalDetails review={review} result={job.result ?? null} />
                            )}
                        </>
                    )}

                    {terminal && reviewQuery.isPending && (
                        <LoadingCard>Loading the review…</LoadingCard>
                    )}

                    {terminal && reviewQuery.isError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Review could not be loaded</AlertTitle>
                            <AlertDescription className="space-y-2">
                                <p>
                                    {getAuthoringErrorMessage(
                                        reviewQuery.error,
                                        "The review could not be loaded.",
                                    )}
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void reviewQuery.refetch()}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry review
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {terminal && review && !reviewQuery.isError && job.state === "completed" && (
                        <ReviewPanel
                            key={`review-${jobId}-${reviewEpoch}`}
                            jobId={jobId}
                            review={review}
                            result={job.result ?? null}
                            onStaleArtifact={handleStaleArtifact}
                        />
                    )}
                </>
            )}
        </div>
    );
}
