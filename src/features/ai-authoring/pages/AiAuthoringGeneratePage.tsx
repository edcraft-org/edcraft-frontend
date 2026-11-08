import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/api";
import { ROUTES } from "@/router/paths";
import { GeneratePanel } from "../components/GeneratePanel";
import { FlowSteps } from "../components/FlowSteps";
import { PageShell } from "../components/PageShell";
import { getAuthoringErrorMessage, isNotFoundError } from "../errors";
import { isApproved } from "../getApprovalBlockers";
import {
    useAuthoringCapabilities,
    useAuthoringJob,
    useAuthoringReview,
} from "../hooks/useAiAuthoring";

function LoadingCard({ children }: { children: string }) {
    return (
        <Card>
            <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
        </Card>
    );
}

const STALE_ARTIFACT_MESSAGE =
    "The checked question changed. The latest review is being loaded and any generated questions from the previous version were cleared.";

export default function AiAuthoringGeneratePage() {
    const { jobId } = useParams<{ jobId: string }>();
    const queryClient = useQueryClient();
    const [staleJobId, setStaleJobId] = useState<string | null>(null);

    const jobQuery = useAuthoringJob(jobId);
    const reviewTerminal =
        jobQuery.data?.state === "completed" || jobQuery.data?.state === "failed";
    const reviewQuery = useAuthoringReview(jobId, reviewTerminal);
    const capabilitiesQuery = useAuthoringCapabilities();

    const handleStaleArtifact = useCallback(() => {
        setStaleJobId(jobId ?? null);
        if (!jobId) return;
        queryClient.removeQueries({ queryKey: queryKeys.aiAuthoring.previewRoot(jobId) });
        // The job key prefix also covers the review and preview child keys.
        void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.job(jobId) });
    }, [jobId, queryClient]);

    if (!jobId) {
        return (
            <PageShell>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No question selected</AlertTitle>
                    <AlertDescription>
                        <Link className="underline underline-offset-2" to={ROUTES.AI_AUTHORING}>
                            Create a new question
                        </Link>
                    </AlertDescription>
                </Alert>
            </PageShell>
        );
    }

    const job = jobQuery.data;
    const review = reviewQuery.data;
    const approved = isApproved(review);

    return (
        <PageShell>
            <FlowSteps current={3} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <Link
                        to={ROUTES.AI_AUTHORING_JOB(jobId)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to review
                    </Link>
                    <h1 className="text-2xl font-semibold">Create question set</h1>
                    <p className="text-sm text-muted-foreground">
                        Every question uses the same approved version.
                    </p>
                </div>
                {review && (
                    <Badge variant={approved ? "default" : "outline"}>
                        {approved ? "Approved" : "Approval needed"}
                    </Badge>
                )}
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

            {job && staleJobId === jobId && (
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

            {job && job.state !== "completed" && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>This question is not ready to reuse</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>Only completed questions can be reused.</p>
                        <Link
                            className="underline underline-offset-2"
                            to={ROUTES.AI_AUTHORING_JOB(jobId)}
                        >
                            Return to the review
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {job && job.state === "completed" && reviewQuery.isPending && (
                <LoadingCard>Loading the review…</LoadingCard>
            )}

            {job && job.state === "completed" && reviewQuery.isError && (
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

            {job && review && capabilitiesQuery.isPending && (
                <LoadingCard>Loading question settings…</LoadingCard>
            )}

            {job && review && capabilitiesQuery.isError && (
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

            {job && review && capabilitiesQuery.data && !reviewQuery.isError && (
                <GeneratePanel
                    key={`generate-${jobId}`}
                    jobId={jobId}
                    review={review}
                    maxQuantity={capabilitiesQuery.data.max_quantity}
                    onStaleArtifact={handleStaleArtifact}
                />
            )}
        </PageShell>
    );
}
