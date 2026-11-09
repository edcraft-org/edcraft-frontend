import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";
import { capitalize, formatDate } from "../format";
import { useDecideAuthoringApproval } from "../hooks/useAiAuthoring";
import type { ApprovalDecision, AuthoringReview } from "../types";

interface ApprovalControlsProps {
    jobId: string;
    review: AuthoringReview;
    canApprove: boolean;
    onStaleArtifact: () => void;
}

export function ApprovalControls({
    jobId,
    review,
    canApprove,
    onStaleArtifact,
}: ApprovalControlsProps) {
    const [actionError, setActionError] = useState<string | null>(null);
    const approval = review.approval;
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
                    note: null,
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
                            "The review decision could not be saved.",
                        ),
                    );
                },
            },
        );
    };

    return (
        <section aria-labelledby="approval-heading" className="space-y-3">
            <h2 id="approval-heading" className="font-medium">
                Review decision
            </h2>

            {approval && (
                <div
                    className={cn(
                        "rounded-md border p-3 text-sm",
                        approval.decision === "approved"
                            ? "border-success/40 bg-success/10"
                            : "border-destructive/40 bg-destructive/10",
                    )}
                >
                    <p>
                        {capitalize(approval.decision)} on {formatDate(approval.decided_at)}
                    </p>
                    {approval.note && <p className="mt-1">Note: {approval.note}</p>}
                </div>
            )}

            {!canApprove && (
                <p className="text-sm text-muted-foreground">
                    Approval is unavailable until the technical checks pass.
                </p>
            )}

            {actionError && (
                <Alert variant="destructive" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Decision not saved</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                {approval?.decision !== "approved" && (
                    <Button
                        type="button"
                        variant="success"
                        className="w-full"
                        onClick={() => decide("approved")}
                        disabled={!canApprove || approvalMutation.isPending}
                    >
                        {approvalMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        )}
                        Approve question
                    </Button>
                )}
                {approval?.decision !== "rejected" && (
                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => decide("rejected")}
                        disabled={!canApprove || approvalMutation.isPending}
                    >
                        Reject question
                    </Button>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Approval applies to this exact version.
            </p>
        </section>
    );
}
