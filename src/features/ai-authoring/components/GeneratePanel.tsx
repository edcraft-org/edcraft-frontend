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
import { formatDate } from "../format";
import { isApproved } from "../getApprovalBlockers";
import { useGenerateAuthoringBatch } from "../hooks/useAiAuthoring";
import type { AuthoringBatch, AuthoringReview, GenerationMetadata } from "../types";
import { MAX_SEED, seedRangeError } from "../validation";
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
    // decision and decision timestamp as well as the artifact digest.
    const approvalKey = [
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
            setInputError("The current artifact is not approved for generation.");
            return;
        }

        const quantity = Number(quantityInput);
        const seed = Number(seedInput);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
            setInputError(`Quantity must be a whole number from 1 to ${maxQuantity}.`);
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
                            "The question batch could not be generated.",
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
                    <CardTitle>Generate and export</CardTitle>
                    <Badge variant={approved ? "default" : "outline"}>
                        {approved ? "Approved artifact" : "Approval required"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                {!approved ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Generation is locked</AlertTitle>
                        <AlertDescription>
                            Approve the current checked artifact before generating a batch. A
                            rejected or stale artifact cannot be generated.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Generation uses the approved artifact digest and consecutive deterministic
                        seeds. No model is called.
                    </p>
                )}

                {lastGeneration && (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Last generated batch</p>
                        <p className="text-muted-foreground">
                            Base seed {lastGeneration.base_seed} · requested{" "}
                            {lastGeneration.requested_quantity} · actual{" "}
                            {lastGeneration.actual_quantity} · distinct{" "}
                            {lastGeneration.distinct_count} · duplicates{" "}
                            {lastGeneration.duplicates}
                        </p>
                        {(lastGeneration.warnings ?? []).length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                {(lastGeneration.warnings ?? []).map((warning) => (
                                    <li key={warning}>{warning}</li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                            Persisted {formatDate(lastGeneration.created_at)}. Generate again to
                            download a new batch.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="generation-quantity">Quantity</Label>
                        <Input
                            id="generation-quantity"
                            type="number"
                            min={1}
                            max={maxQuantity}
                            step={1}
                            value={quantityInput}
                            onChange={(event) => setQuantityInput(event.target.value)}
                            disabled={!approved || generation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            Whole numbers from 1 to {maxQuantity}.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="generation-seed">Base seed</Label>
                        <Input
                            id="generation-seed"
                            type="number"
                            step={1}
                            value={seedInput}
                            onChange={(event) => setSeedInput(event.target.value)}
                            disabled={!approved || generation.isPending}
                        />
                        <p className="text-xs text-muted-foreground">
                            {canPreviewSeeds
                                ? `Seeds ${seed} through ${seed + quantity - 1}.`
                                : `Whole numbers from 0 to ${MAX_SEED}; the last seed must stay in range.`}
                        </p>
                    </div>
                </div>

                {inputError && (
                    <p role="alert" className="text-sm text-destructive">
                        {inputError}
                    </p>
                )}

                {actionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Generation failed</AlertTitle>
                        <AlertDescription>{actionError}</AlertDescription>
                    </Alert>
                )}

                <Button
                    type="button"
                    onClick={generate}
                    disabled={!approved || generation.isPending}
                >
                    {generation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {batch ? "Generate another batch" : "Generate batch"}
                </Button>

                {batch && (
                    <section aria-labelledby="batch-heading" className="space-y-4 border-t pt-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 id="batch-heading" className="font-medium">
                                    Generated draft batch
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Requested {batch.requested_quantity} · actual{" "}
                                    {batch.actual_quantity} · distinct {batch.distinct_count} ·
                                    duplicates {batch.duplicates}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => downloadAuthoringBatch(batch)}
                            >
                                <Download className="h-4 w-4" />
                                Download JSON
                            </Button>
                        </div>

                        {(batch.warnings ?? []).length > 0 && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Batch warnings</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc space-y-1 pl-4">
                                        {(batch.warnings ?? []).map((warning) => (
                                            <li key={warning}>{warning}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {batch.questions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                The batch contains no questions.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {batch.questions.map((instance) => (
                                    <details
                                        key={`${instance.template_id}-${instance.seed}`}
                                        className="rounded-md border p-3"
                                    >
                                        <summary className="cursor-pointer text-sm font-medium">
                                            Question seed {instance.seed}
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
