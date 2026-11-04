import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";
import { capitalize, formatDate } from "../format";
import { useDecideAuthoringApproval } from "../hooks/useAiAuthoring";
import type { ApprovalDecision, AuthoringReview } from "../types";

interface ApprovalControlsProps {
    jobId: string;
    review: AuthoringReview;
    blockers: string[];
    canApprove: boolean;
    onStaleArtifact: () => void;
}

export function ApprovalControls({
    jobId,
    review,
    blockers,
    canApprove,
    onStaleArtifact,
}: ApprovalControlsProps) {
    const [note, setNote] = useState("");
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
                            "The review decision could not be saved.",
                        ),
                    );
                },
            },
        );
    };

    return (
        <section aria-labelledby="approval-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="approval-heading" className="font-medium">
                    Review decision
                </h3>
                {approval ? (
                    <Badge variant={approval.decision === "approved" ? "default" : "destructive"}>
                        {approval.decision === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                ) : (
                    <Badge variant="outline">Not reviewed</Badge>
                )}
            </div>

            {approval && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <p>
                        {capitalize(approval.decision)} on {formatDate(approval.decided_at)}
                    </p>
                    {approval.note && <p className="mt-1">Note: {approval.note}</p>}
                </div>
            )}

            {blockers.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>This question cannot be approved yet</AlertTitle>
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
                    placeholder="Optional review note"
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
                        ? "Approve this version again"
                        : "Approve question"}
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    onClick={() => decide("rejected")}
                    disabled={!canApprove || approvalMutation.isPending}
                >
                    {approval?.decision === "rejected"
                        ? "Confirm rejection"
                        : "Reject question"}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Applies to this exact version. If the question changes, review it again.
            </p>
        </section>
    );
}
