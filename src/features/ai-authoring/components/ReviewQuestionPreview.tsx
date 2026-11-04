import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const [seedInput, setSeedInput] = useState("0");
    const [seedError, setSeedError] = useState<string | null>(null);
    const previewQuery = useAuthoringPreview(jobId, artifactSha256, previewSeed);

    useEffect(() => {
        setSeedInput(String(previewSeed));
    }, [previewSeed]);

    const showAnotherVariation = () => {
        setSeedError(null);
        setPreviewSeed((seed) => Math.min(seed + 1, MAX_SEED));
    };

    const loadSeed = () => {
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
            <CardHeader className="gap-3 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>Sample question</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Seed {previewSeed} · variations may repeat
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                            <Label htmlFor="preview-seed" className="text-xs">
                                Seed
                            </Label>
                            <Input
                                id="preview-seed"
                                type="number"
                                step={1}
                                value={seedInput}
                                onChange={(event) => setSeedInput(event.target.value)}
                                className="h-9 w-32"
                                aria-invalid={Boolean(seedError)}
                                aria-describedby={seedError ? "preview-seed-error" : undefined}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={loadSeed}
                            disabled={!artifactSha256}
                        >
                            Load
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={showAnotherVariation}
                            disabled={previewSeed >= MAX_SEED || !artifactSha256}
                        >
                            Next variation
                        </Button>
                    </div>
                </div>
                {seedError && (
                    <p id="preview-seed-error" className="text-sm text-destructive">
                        {seedError}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                {!artifactSha256 && (
                    <p className="text-sm text-muted-foreground">
                        A sample is available after the question has been checked.
                    </p>
                )}
                {previewQuery.isPending && artifactSha256 && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading sample…
                    </p>
                )}
                {previewQuery.isError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Sample could not be loaded</AlertTitle>
                        <AlertDescription className="space-y-2">
                            <p>
                                {getAuthoringErrorMessage(
                                    previewQuery.error,
                                    "The sample question could not be loaded.",
                                )}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {isStaleArtifactError(previewQuery.error) ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={onStaleArtifact}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Refresh evidence
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void previewQuery.refetch()}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Retry sample
                                    </Button>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
                {previewQuery.data && !previewQuery.isError && (
                    <PreviewQuestion instance={previewQuery.data.question} />
                )}
            </CardContent>
        </Card>
    );
}
