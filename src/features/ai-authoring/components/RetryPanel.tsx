import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { getAuthoringErrorMessage } from "../errors";
import { capitalize } from "../format";
import { useCreateAuthoringJob } from "../hooks/useAiAuthoring";
import {
    buildModelRequest,
    parseModelSource,
    resolveModelSelection,
} from "../modelSelection";
import type {
    AuthoringCapabilities,
    AuthoringRetryPrefill,
    AuthoringReview,
} from "../types";
import { ModelPicker } from "./ModelPicker";

interface RetryPanelProps {
    request: AuthoringReview["request"];
    capabilities: AuthoringCapabilities;
}

export function RetryPanel({ request, capabilities }: RetryPanelProps) {
    const navigate = useNavigate();
    const createJob = useCreateAuthoringJob();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const connections = capabilities.connections ?? [];
    const profiles = capabilities.model_profiles;
    const initial = resolveModelSelection({
        connections,
        profiles,
        connectionId: request.connection_id,
        profileId: request.model_profile,
        model: request.model,
    });
    const [modelSource, setModelSource] = useState(initial.source);
    const [model, setModel] = useState(initial.model);

    const source = parseModelSource(modelSource);
    const selectedConnection =
        source?.kind === "connection"
            ? connections.find((connection) => connection.id === source.id)
            : undefined;
    const canRetry =
        Boolean(modelSource) &&
        (source?.kind !== "connection" || Boolean(model.trim())) &&
        !createJob.isPending;
    const originalConnectionMissing =
        Boolean(request.connection_id) &&
        !connections.some((connection) => connection.id === request.connection_id);
    const originalProfileMissing =
        Boolean(request.model_profile) &&
        !profiles.some((profile) => profile.id === request.model_profile);
    const hasAnyModel = connections.length > 0 || profiles.length > 0;

    const prefill: AuthoringRetryPrefill = {
        prompt: request.prompt,
        difficulty: request.difficulty,
        num_distractors: request.num_distractors,
        ...buildModelRequest(modelSource, model),
    };

    const retry = () => {
        if (!canRetry) return;
        setSubmitError(null);
        createJob.mutate(
            {
                domain: "code",
                prompt: request.prompt,
                difficulty: request.difficulty,
                num_distractors: request.num_distractors,
                ...buildModelRequest(modelSource, model),
            },
            {
                onSuccess: (job) => {
                    navigate(ROUTES.AI_AUTHORING_JOB(job.job_id), { replace: true });
                },
                onError: (error) => {
                    setSubmitError(
                        getAuthoringErrorMessage(error, "The question could not be restarted."),
                    );
                },
            },
        );
    };

    return (
        <Card>
            <CardHeader className="gap-2 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Retry request</CardTitle>
                    <Badge variant="outline">New job</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Reuse the same request with a model you choose.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                    {request.prompt}
                </p>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{capitalize(request.difficulty)}</Badge>
                    <Badge variant="outline">{request.num_distractors + 1} choices</Badge>
                    <Badge variant="outline">Code</Badge>
                </div>

                <div className="max-w-md">
                    {hasAnyModel ? (
                        <ModelPicker
                            connections={connections}
                            profiles={profiles}
                            source={modelSource}
                            model={model}
                            onSourceChange={(nextSource, nextModel) => {
                                setModelSource(nextSource);
                                setModel(nextModel);
                            }}
                            onModelChange={setModel}
                            disabled={createJob.isPending}
                            idPrefix="retry-model"
                        />
                    ) : (
                        <p className="text-xs text-destructive">
                            No question-writing model is configured.
                        </p>
                    )}
                </div>

                {(originalConnectionMissing || originalProfileMissing) && hasAnyModel && (
                    <p className="text-xs text-amber-600">
                        The original model is no longer available. Another model is selected.
                    </p>
                )}

                {selectedConnection && (
                    <p className="text-xs text-muted-foreground">
                        Retrying with {selectedConnection.name} · key ending{" "}
                        {selectedConnection.key_last4}.
                    </p>
                )}

                {submitError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Retry could not be started</AlertTitle>
                        <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button type="button" onClick={retry} disabled={!canRetry}>
                        {createJob.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        )}
                        {createJob.isPending ? "Starting…" : "Retry question"}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link to={ROUTES.AI_AUTHORING} state={{ authoringPrefill: prefill }}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit request
                        </Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Creates a new job. The failed attempt is kept.
                </p>
            </CardContent>
        </Card>
    );
}
