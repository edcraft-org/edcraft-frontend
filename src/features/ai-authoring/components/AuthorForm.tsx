import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/router/paths";
import { getAuthoringErrorMessage } from "../errors";
import { capitalize } from "../format";
import { useCreateAuthoringJob } from "../hooks/useAiAuthoring";
import type { AuthoringCapabilities, AuthoringDifficulty } from "../types";

const authoringSchema = z.object({
    prompt: z
        .string()
        .trim()
        .min(1, "Describe the question you want to create.")
        .max(4000, "Keep the request to 4000 characters or fewer."),
    difficulty: z.enum(["easy", "medium", "hard"]),
    num_distractors: z.union([z.literal(2), z.literal(3)]),
    model_profile: z.string().min(1, "Choose a question-writing model."),
});

type AuthoringFormValues = z.infer<typeof authoringSchema>;

const DIFFICULTY_ORDER: AuthoringDifficulty[] = ["easy", "medium", "hard"];

interface AuthorFormProps {
    capabilities: AuthoringCapabilities;
}

export function AuthorForm({ capabilities }: AuthorFormProps) {
    const navigate = useNavigate();
    const createJob = useCreateAuthoringJob();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const summaryRef = useRef<HTMLDivElement>(null);

    const difficultyOptions = DIFFICULTY_ORDER.filter((difficulty) =>
        capabilities.difficulty_labels.includes(difficulty),
    );
    const defaultDifficulty = difficultyOptions[0] ?? "easy";
    const defaultProfile = capabilities.model_profiles[0]?.id ?? "";

    const form = useForm<AuthoringFormValues>({
        resolver: zodResolver(authoringSchema),
        defaultValues: {
            prompt: "",
            difficulty: defaultDifficulty,
            num_distractors: 3,
            model_profile: defaultProfile,
        },
    });
    const prompt = form.watch("prompt");

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
                num_distractors: values.num_distractors,
                model_profile: values.model_profile,
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
                        The server has not enabled code questions for this feature.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (capabilities.model_profiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No question-writing model configured</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        An administrator must configure a question-writing model. This page never
                        asks for API keys or provider endpoints.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create a code question</CardTitle>
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
                    <form
                        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                        className="space-y-6"
                        noValidate
                    >
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question prompt</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={7}
                                            maxLength={4000}
                                            placeholder="Describe the programming concept and what students should reason about."
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {prompt.length} / 4000 characters. The request is sent to a
                                        configured model on the server.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                            className="flex flex-wrap gap-4"
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
                            name="num_distractors"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel id="choices-label">Answer choices</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            value={String(field.value)}
                                            onValueChange={(value) =>
                                                field.onChange(value === "2" ? 2 : 3)
                                            }
                                            aria-labelledby="choices-label"
                                            className="flex flex-wrap gap-4"
                                        >
                                            {[2, 3].map((count) => (
                                                <div key={count} className="flex items-center gap-2">
                                                    <RadioGroupItem
                                                        id={`choices-${count}`}
                                                        value={String(count)}
                                                    />
                                                    <Label
                                                        htmlFor={`choices-${count}`}
                                                        className="font-normal"
                                                    >
                                                        {count + 1} choices
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormDescription>
                                        One choice is correct; the others are plausible wrong
                                        answers. The question is multiple choice.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <details className="rounded-lg border p-4">
                            <summary className="cursor-pointer text-sm font-medium">
                                Advanced options
                            </summary>
                            <div className="mt-4 space-y-5">
                                <FormField
                                    control={form.control}
                                    name="model_profile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Question-writing model</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a profile" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {capabilities.model_profiles.map((profile) => (
                                                        <SelectItem
                                                            key={profile.id}
                                                            value={profile.id}
                                                        >
                                                            {profile.label} · {profile.provider}/
                                                            {profile.model}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Models are configured by the server. No API keys or
                                                endpoint fields are stored in this browser.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    <p className="font-medium">Review model (server configured)</p>
                                    <p className="text-muted-foreground">
                                        {capabilities.judge
                                            ? `${capabilities.judge.label} · ${capabilities.judge.provider}/${capabilities.judge.model}`
                                            : "Judge details are not configured."}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Difficulty and relevance judgments are advisory and separate
                                        from the question-writing model.
                                    </p>
                                </div>
                            </div>
                        </details>

                        <Button
                            type="submit"
                            disabled={createJob.isPending || difficultyOptions.length === 0}
                        >
                            {createJob.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="h-4 w-4" aria-hidden="true" />
                            )}
                            {createJob.isPending ? "Creating question…" : "Create question"}
                        </Button>
                        {difficultyOptions.length === 0 && (
                            <p className="text-sm text-destructive">
                                The server did not publish any difficulty options.
                            </p>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
