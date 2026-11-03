import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";
import { useAuthoringPreview } from "../hooks/useAiAuthoring";
import { MAX_SEED, seedError as validateSeed } from "../validation";
import { PreviewQuestion } from "./PreviewQuestion";

interface ReviewQuestionPreviewProps {
    jobId: string;
    artifactSha256: string | null | undefined;
    onStaleArtifact: () => void;
}

export function ReviewQuestionPreview({
    jobId,
    artifactSha256,
    onStaleArtifact,
}: ReviewQuestionPreviewProps) {
    const [previewSeed, setPreviewSeed] = useState(0);
    const [exactSeedInput, setExactSeedInput] = useState("0");
    const [seedError, setSeedError] = useState<string | null>(null);
    const previewQuery = useAuthoringPreview(jobId, artifactSha256, previewSeed);

    useEffect(() => {
        setExactSeedInput(String(previewSeed));
    }, [previewSeed]);

    const showAnotherVariation = () => {
        setSeedError(null);
        setPreviewSeed((seed) => Math.min(seed + 1, MAX_SEED));
    };

    const loadExactSeed = () => {
        if (!exactSeedInput.trim()) {
            setSeedError(`Enter a seed from 0 to ${MAX_SEED}.`);
            return;
        }
        const parsed = Number(exactSeedInput);
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
        <section aria-labelledby="preview-heading" className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 id="preview-heading" className="font-medium">
                        Question preview
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Example {previewSeed + 1}. Try another example from this question template.
                        Some examples may repeat.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={showAnotherVariation}
                    disabled={previewSeed >= MAX_SEED || !artifactSha256}
                >
                    Show another variation
                </Button>
            </div>

            {!artifactSha256 && (
                <p className="text-sm text-muted-foreground">
                    A preview is available after the question has been checked.
                </p>
            )}
            {previewQuery.isPending && artifactSha256 && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading the question preview…
                </p>
            )}
            {previewQuery.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Preview could not be loaded</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            {getAuthoringErrorMessage(
                                previewQuery.error,
                                "The question preview could not be loaded.",
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
            {previewQuery.data && <PreviewQuestion instance={previewQuery.data.question} />}

            <details className="rounded-md border p-3 text-sm">
                <summary className="cursor-pointer font-medium">Advanced preview options</summary>
                <div className="mt-3 space-y-2">
                    <Label htmlFor="preview-exact-seed">Exact seed</Label>
                    <div className="flex flex-wrap items-end gap-2">
                        <Input
                            id="preview-exact-seed"
                            type="number"
                            step={1}
                            value={exactSeedInput}
                            onChange={(event) => setExactSeedInput(event.target.value)}
                            className="w-40"
                            aria-invalid={Boolean(seedError)}
                            aria-describedby={seedError ? "preview-seed-error" : "preview-seed-help"}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={loadExactSeed}
                            disabled={!artifactSha256}
                        >
                            Load exact seed
                        </Button>
                    </div>
                    {seedError ? (
                        <p id="preview-seed-error" className="text-sm text-destructive">
                            {seedError}
                        </p>
                    ) : (
                        <p id="preview-seed-help" className="text-xs text-muted-foreground">
                            The same seed always shows the same question variation.
                        </p>
                    )}
                </div>
            </details>
        </section>
    );
}
