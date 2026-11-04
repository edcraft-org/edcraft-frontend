import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ROUTES } from "@/router/paths";
import { getAuthoringErrorMessage } from "../errors";
import { capitalize } from "../format";
import { useCreateAuthoringJob } from "../hooks/useAiAuthoring";
import {
    buildJudgeSelections,
    buildModelRequest,
    isInheritSource,
    parseModelSource,
    resolveJudgeSelection,
    resolveModelSelection,
} from "../modelSelection";
import type {
    AuthoringCapabilities,
    AuthoringDifficulty,
    AuthoringRetryPrefill,
} from "../types";
import { ModelPicker } from "./ModelPicker";

function createAuthoringSchema(minChoices: number, maxChoices: number) {
    return z
        .object({
            prompt: z
                .string()
                .trim()
                .min(1, "Describe the question you want to create.")
                .max(4000, "Keep the request to 4000 characters or fewer."),
            difficulty: z.enum(["easy", "medium", "hard"]),
            choices: z
                .number()
                .int("Enter a whole number of choices.")
                .min(minChoices, `Enter at least ${minChoices} choices.`)
                .max(maxChoices, `Enter at most ${maxChoices} choices.`),
            model_source: z.string().min(1, "Choose a question-writing model."),
            model: z.string(),
            difficulty_source: z.string(),
            difficulty_model: z.string(),
            relevance_source: z.string(),
            relevance_model: z.string(),
        })
        .superRefine((values, ctx) => {
            const source = parseModelSource(values.model_source);
            if (source?.kind === "connection" && !values.model.trim()) {
                ctx.addIssue({
                    code: "custom",
                    path: ["model"],
                    message: "Choose a model for this connection.",
                });
            }
            for (const [sourceKey, modelKey] of [
                ["difficulty_source", "difficulty_model"],
                ["relevance_source", "relevance_model"],
            ] as const) {
                const selected = parseModelSource(values[sourceKey]);
                if (selected?.kind === "connection" && !values[modelKey].trim()) {
                    ctx.addIssue({
                        code: "custom",
                        path: [modelKey],
                        message: "Choose a model for this connection.",
                    });
                }
                if (!isInheritSource(values[sourceKey]) && !selected) {
                    ctx.addIssue({
                        code: "custom",
                        path: [sourceKey],
                        message: "Choose a check model or inherit the question model.",
                    });
                }
            }
        });
}

type AuthoringFormValues = z.infer<ReturnType<typeof createAuthoringSchema>>;

const DIFFICULTY_ORDER: AuthoringDifficulty[] = ["easy", "medium", "hard"];

interface AuthorFormProps {
    capabilities: AuthoringCapabilities;
}

export function AuthorForm({ capabilities }: AuthorFormProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const createJob = useCreateAuthoringJob();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const summaryRef = useRef<HTMLDivElement>(null);

    const difficultyOptions = DIFFICULTY_ORDER.filter((difficulty) =>
        capabilities.difficulty_labels.includes(difficulty),
    );
    const defaultDifficulty = difficultyOptions[0] ?? "easy";
    const connections = capabilities.connections ?? [];
    const profiles = capabilities.model_profiles;
    const minChoices = (capabilities.min_distractors ?? 1) + 1;
    const maxChoices = (capabilities.max_distractors ?? 10) + 1;
    const defaultChoices = (capabilities.default_distractors ?? 3) + 1;
    const authoringSchema = useMemo(
        () => createAuthoringSchema(minChoices, maxChoices),
        [minChoices, maxChoices],
    );

    const state = location.state as { authoringPrefill?: Partial<AuthoringRetryPrefill> } | null;
    const prefill = state?.authoringPrefill;
    const prefilledPrompt =
        typeof prefill?.prompt === "string" ? prefill.prompt.slice(0, 4000) : "";
    const prefilledDifficulty =
        prefill?.difficulty && difficultyOptions.includes(prefill.difficulty)
            ? prefill.difficulty
            : defaultDifficulty;
    const prefilledChoices =
        typeof prefill?.num_distractors === "number"
            ? Math.min(
                  maxChoices,
                  Math.max(minChoices, prefill.num_distractors + 1),
              )
            : defaultChoices;
    const initialSelection = resolveModelSelection({
        connections,
        profiles,
        connectionId: prefill?.connection_id,
        profileId: prefill?.model_profile,
        model: prefill?.model,
    });
    const initialDifficultySelection = resolveJudgeSelection({
        connections,
        profiles,
        selection: prefill?.judges?.difficulty,
    });
    const initialRelevanceSelection = resolveJudgeSelection({
        connections,
        profiles,
        selection: prefill?.judges?.relevance,
    });
    const prefilled = Boolean(prefill);

    const form = useForm<AuthoringFormValues>({
        resolver: zodResolver(authoringSchema),
        defaultValues: {
            prompt: prefilledPrompt,
            difficulty: prefilledDifficulty,
            choices: prefilledChoices,
            model_source: initialSelection.source,
            model: initialSelection.model,
            difficulty_source: initialDifficultySelection.source,
            difficulty_model: initialDifficultySelection.model,
            relevance_source: initialRelevanceSelection.source,
            relevance_model: initialRelevanceSelection.model,
        },
    });
    const prompt = form.watch("prompt");
    const modelSource = form.watch("model_source");
    const model = form.watch("model");
    const difficultySource = form.watch("difficulty_source");
    const difficultyModel = form.watch("difficulty_model");
    const relevanceSource = form.watch("relevance_source");
    const relevanceModel = form.watch("relevance_model");

    useEffect(() => {
        if (submitError) summaryRef.current?.focus();
    }, [submitError]);

    const onInvalid = () => {
        setSubmitError("Check the highlighted fields and try again.");
    };

    const onSubmit = (values: AuthoringFormValues) => {
        setSubmitError(null);
        createJob.mutate(
            {
                domain: "code",
                prompt: values.prompt,
                difficulty: values.difficulty,
                num_distractors: values.choices - 1,
                ...buildModelRequest(values.model_source, values.model),
                judges: buildJudgeSelections(
                    {
                        source: values.difficulty_source,
                        model: values.difficulty_model,
                    },
                    {
                        source: values.relevance_source,
                        model: values.relevance_model,
                    },
                ),
            },
            {
                onSuccess: (job) => {
                    navigate(ROUTES.AI_AUTHORING_JOB(job.job_id), { replace: true });
                },
                onError: (error) => {
                    setSubmitError(
                        getAuthoringErrorMessage(error, "The question could not be started."),
                    );
                },
            },
        );
    };

    if (!capabilities.enabled_domains.includes("code")) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Question creation is unavailable</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Code questions are not enabled on this server.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (connections.length === 0 && profiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No question-writing model configured</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Add your own OpenAI or SocLaas connection to start authoring.
                        Your API key is encrypted and only used for your jobs.
                    </p>
                    <Button asChild>
                        <Link to={ROUTES.MODEL_CONNECTIONS}>Add a model connection</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>New question</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        {prefilled && <Badge variant="secondary">Prefilled</Badge>}
                        <Badge variant="outline">Code · multiple choice</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {submitError && (
                    <div ref={summaryRef} tabIndex={-1} className="mb-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>The question could not be started</AlertTitle>
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }) => (
                                        <FormItem className="flex h-full flex-col">
                                            <FormLabel>Prompt</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    rows={12}
                                                    maxLength={4000}
                                                    className="min-h-64 resize-y"
                                                    placeholder="Describe the programming concept and what students should reason about."
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {prompt.length} / 4000
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-5 lg:border-l lg:pl-6">
                                <p className="text-sm font-medium">Settings</p>

                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel id="difficulty-label">Difficulty</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    aria-labelledby="difficulty-label"
                                                    className="flex flex-wrap gap-4 lg:flex-col lg:gap-2"
                                                >
                                                    {difficultyOptions.map((difficulty) => (
                                                        <div
                                                            key={difficulty}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <RadioGroupItem
                                                                id={`difficulty-${difficulty}`}
                                                                value={difficulty}
                                                            />
                                                            <Label
                                                                htmlFor={`difficulty-${difficulty}`}
                                                                className="font-normal"
                                                            >
                                                                {capitalize(difficulty)}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="choices"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="choices">Choices</FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="choices"
                                                    type="number"
                                                    min={minChoices}
                                                    max={maxChoices}
                                                    step={1}
                                                    {...field}
                                                    onChange={(event) =>
                                                        field.onChange(
                                                            Number(event.target.value),
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {minChoices}–{maxChoices} options, including the
                                                correct answer.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <ModelPicker
                                    connections={connections}
                                    profiles={profiles}
                                    source={modelSource}
                                    model={model}
                                    onSourceChange={(source, nextModel) => {
                                        form.setValue("model_source", source, {
                                            shouldValidate: true,
                                        });
                                        form.setValue("model", nextModel, {
                                            shouldValidate: true,
                                        });
                                    }}
                                    onModelChange={(nextModel) =>
                                        form.setValue("model", nextModel, {
                                            shouldValidate: true,
                                        })
                                    }
                                    sourceError={form.formState.errors.model_source?.message}
                                    modelError={form.formState.errors.model?.message}
                                    disabled={createJob.isPending}
                                />

                                <div className="space-y-4 rounded-md border bg-muted/30 p-3">
                                    <div>
                                        <p className="text-sm font-medium">Advisory checks</p>
                                        <p className="text-xs text-muted-foreground">
                                            Keep the question model, or choose a separate model
                                            when it cannot run the checks. They are advisory and
                                            never block a technically checked artifact.
                                        </p>
                                    </div>
                                    <ModelPicker
                                        connections={connections}
                                        profiles={profiles}
                                        source={difficultySource}
                                        model={difficultyModel}
                                        onSourceChange={(source, nextModel) => {
                                            form.setValue("difficulty_source", source, {
                                                shouldValidate: true,
                                            });
                                            form.setValue("difficulty_model", nextModel, {
                                                shouldValidate: true,
                                            });
                                        }}
                                        onModelChange={(nextModel) =>
                                            form.setValue("difficulty_model", nextModel, {
                                                shouldValidate: true,
                                            })
                                        }
                                        sourceError={
                                            form.formState.errors.difficulty_source?.message
                                        }
                                        modelError={
                                            form.formState.errors.difficulty_model?.message
                                        }
                                        disabled={createJob.isPending}
                                        idPrefix="difficulty-check"
                                        label="Difficulty check"
                                        allowInherit
                                    />
                                    <ModelPicker
                                        connections={connections}
                                        profiles={profiles}
                                        source={relevanceSource}
                                        model={relevanceModel}
                                        onSourceChange={(source, nextModel) => {
                                            form.setValue("relevance_source", source, {
                                                shouldValidate: true,
                                            });
                                            form.setValue("relevance_model", nextModel, {
                                                shouldValidate: true,
                                            });
                                        }}
                                        onModelChange={(nextModel) =>
                                            form.setValue("relevance_model", nextModel, {
                                                shouldValidate: true,
                                            })
                                        }
                                        sourceError={
                                            form.formState.errors.relevance_source?.message
                                        }
                                        modelError={
                                            form.formState.errors.relevance_model?.message
                                        }
                                        disabled={createJob.isPending}
                                        idPrefix="relevance-check"
                                        label="Relevance check"
                                        allowInherit
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
                            <Button
                                type="submit"
                                disabled={createJob.isPending || difficultyOptions.length === 0}
                            >
                                {createJob.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                )}
                                {createJob.isPending ? "Creating…" : "Create question"}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Connection keys are encrypted at rest.
                            </p>
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs"
                                asChild
                            >
                                <Link to={ROUTES.MODEL_CONNECTIONS}>Manage connections</Link>
                            </Button>
                        </div>
                        {difficultyOptions.length === 0 && (
                            <p className="mt-2 text-sm text-destructive">
                                The server did not publish any difficulty options.
                            </p>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
