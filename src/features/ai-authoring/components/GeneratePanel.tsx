import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadAuthoringBatch } from "../download";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";
import { formatCountSummary, formatDate } from "../format";
import { isApproved } from "../getApprovalBlockers";
import { useGenerateAuthoringBatch } from "../hooks/useAiAuthoring";
import type { AuthoringBatch, AuthoringReview, GenerationMetadata } from "../types";
import { MAX_SEED, seedRangeError } from "../validation";
import { EvidenceDetails } from "./EvidenceDetails";
import { PreviewQuestion } from "./PreviewQuestion";

interface GeneratePanelProps {
    jobId: string;
    review: AuthoringReview;
    maxQuantity: number;
    lastGeneration: GenerationMetadata | null;
    onStaleArtifact: () => void;
}

export function GeneratePanel({
    jobId,
    review,
    maxQuantity,
    lastGeneration,
    onStaleArtifact,
}: GeneratePanelProps) {
    const approved = isApproved(review);
    const [quantityInput, setQuantityInput] = useState(String(Math.min(5, maxQuantity)));
    const [seedInput, setSeedInput] = useState("0");
    const [inputError, setInputError] = useState<string | null>(null);
    const [batchState, setBatchState] = useState<{
        approvalKey: string;
        batch: AuthoringBatch;
    } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const generation = useGenerateAuthoringBatch();

    const artifactDigest = review.artifact_sha256;
    // A rejection can keep the same digest, so bind displayed output to the
    // job, decision and decision timestamp as well as the artifact digest. This
    // component owns approval changes; the page key handles navigation and
    // global stale notifications.
    const approvalKey = [
        jobId,
        artifactDigest ?? "",
        review.approval?.artifact_sha256 ?? "",
        review.approval?.decision ?? "unreviewed",
        review.approval?.decided_at ?? "",
    ].join(":");
    const approvalKeyRef = useRef(approvalKey);
    approvalKeyRef.current = approvalKey;
    const batch = approved && batchState?.approvalKey === approvalKey ? batchState.batch : null;

    useEffect(() => {
        setBatchState(null);
        setActionError(null);
    }, [approvalKey]);

    const generate = () => {
        if (generation.isPending) return;
        if (!artifactDigest || !approved) {
            setInputError("Approve this question before creating new questions.");
            return;
        }

        const quantity = Number(quantityInput);
        const seed = Number(seedInput);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
            setInputError(`Choose a whole number of questions from 1 to ${maxQuantity}.`);
            return;
        }
        if (!seedInput.trim()) {
            setInputError(`Enter a seed from 0 to ${MAX_SEED}.`);
            return;
        }
        const invalidSeedRange = seedRangeError(seed, quantity);
        if (invalidSeedRange) {
            setInputError(invalidSeedRange);
            return;
        }

        const requestApprovalKey = approvalKey;
        setInputError(null);
        setActionError(null);
        generation.mutate(
            {
                jobId,
                input: {
                    artifact_sha256: artifactDigest,
                    seed,
                    quantity,
                },
            },
            {
                onSuccess: (result) => {
                    if (approvalKeyRef.current !== requestApprovalKey) return;
                    setBatchState({ approvalKey: requestApprovalKey, batch: result });
                },
                onError: (error) => {
                    if (isStaleArtifactError(error)) {
                        setBatchState(null);
                        onStaleArtifact();
                    }
                    setActionError(
                        getAuthoringErrorMessage(
                            error,
                            "The questions could not be created.",
                        ),
                    );
                },
            },
        );
    };

    const seed = Number(seedInput);
    const quantity = Number(quantityInput);
    const canPreviewSeeds =
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= maxQuantity &&
        seedRangeError(seed, quantity) === null;

    return (
        <Card>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Create questions</CardTitle>
                    <Badge variant={approved ? "default" : "outline"}>
                        {approved ? "Ready to create" : "Approval needed"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {!approved ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Approval needed</AlertTitle>
                        <AlertDescription>
                            Approve this question before creating more versions of it. A rejected
                            question cannot be used to create new questions.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Questions are created from this approved version. The same settings always
                        produce the same questions; no model is called.
                    </p>
                )}

                {lastGeneration && (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Last created set</p>
                        <p className="text-muted-foreground">
                            {formatCountSummary(lastGeneration)} Saved{" "}
                            {formatDate(lastGeneration.created_at)}. Only this summary is saved;
                            create the questions again to download them.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="generation-quantity">Number of questions</Label>
                    <Input
                        id="generation-quantity"
                        type="number"
                        min={1}
                        max={maxQuantity}
                        step={1}
                        value={quantityInput}
                        onChange={(event) => setQuantityInput(event.target.value)}
                        disabled={!approved || generation.isPending}
                        className="max-w-40"
                    />
                    <p className="text-xs text-muted-foreground">
                        Choose a whole number from 1 to {maxQuantity}.
                    </p>
                </div>

                <details className="rounded-lg border p-4">
                    <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
                    <div className="mt-4 space-y-2">
                        <Label htmlFor="generation-seed">Starting seed</Label>
                        <Input
                            id="generation-seed"
                            type="number"
                            step={1}
                            value={seedInput}
                            onChange={(event) => setSeedInput(event.target.value)}
                            disabled={!approved || generation.isPending}
                            className="max-w-40"
                        />
                        <p className="text-xs text-muted-foreground">
                            {canPreviewSeeds
                                ? `Seeds ${seed} through ${seed + quantity - 1}.`
                                : `Whole numbers from 0 to ${MAX_SEED}; the last seed must stay in range.`}{" "}
                            The same settings always produce the same questions.
                        </p>
                        {lastGeneration && (
                            <p className="text-xs text-muted-foreground">
                                Last saved starting seed: {lastGeneration.base_seed}.
                            </p>
                        )}
                        {lastGeneration && (lastGeneration.warnings ?? []).length > 0 && (
                            <EvidenceDetails
                                summary="Last set warnings"
                                value={lastGeneration.warnings}
                            />
                        )}
                    </div>
                </details>

                {inputError && (
                    <p role="alert" className="text-sm text-destructive">
                        {inputError}
                    </p>
                )}

                {actionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Questions could not be created</AlertTitle>
                        <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                )}

                <Button type="button" onClick={generate} disabled={!approved || generation.isPending}>
                    {generation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {batch ? "Create another set" : "Create questions"}
                </Button>

                {batch && (
                    <section aria-labelledby="batch-heading" className="space-y-4 border-t pt-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 id="batch-heading" className="font-medium">
                                    Your questions
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCountSummary(batch)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => downloadAuthoringBatch(batch)}
                            >
                                <Download className="h-4 w-4" />
                                Download questions (JSON)
                            </Button>
                        </div>

                        {(batch.warnings ?? []).length > 0 && (
                            <EvidenceDetails
                                summary="Raw warnings for this set"
                                value={batch.warnings}
                            />
                        )}

                        {batch.questions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No questions were created. Try a different starting seed.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {batch.questions.map((instance, index) => (
                                    <details
                                        key={`${instance.template_id}-${instance.seed}`}
                                        className="rounded-md border p-3"
                                    >
                                        <summary className="cursor-pointer text-sm font-medium">
                                            Question {index + 1}
                                        </summary>
                                        <div className="pt-3">
                                            <PreviewQuestion instance={instance} headingLevel="h4" />
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </CardContent>
        </Card>
    );
}
