// InstantiateAssessmentModal - Multi-step wizard for creating assessment from template

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, ChevronLeft, Check, X, Wand2 } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { InputDataCard } from "@/shared/components";
import {
    useUpdateQuestionTemplate,
    useGenerateFromTemplate,
} from "@/features/question-templates/useQuestionTemplates";
import { QuestionTemplateContent } from "@/components/QuestionTemplateContent";
import { QuestionDisplay } from "@/features/question-builder/components/QuestionDisplay";
import { isAbortError } from "@/api/pollJob";
import type { QuestionTemplateResponse, Question } from "@/api/models";

// Schema for metadata step
const metadataFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
});

type MetadataFormValues = z.infer<typeof metadataFormSchema>;

interface InstantiateAssessmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentTemplateTitle: string;
    questionTemplates: QuestionTemplateResponse[];
    onInstantiate: (
        title: string,
        description: string | undefined,
        questionInputs: Array<Record<string, unknown>>,
    ) => Promise<void>;
    onCancelGeneration?: () => void;
    isLoading?: boolean;
    canEdit: boolean;
}

export function InstantiateAssessmentModal({
    open,
    onOpenChange,
    assessmentTemplateTitle,
    questionTemplates,
    onInstantiate,
    onCancelGeneration,
    isLoading,
    canEdit,
}: InstantiateAssessmentModalProps) {
    const totalSteps = questionTemplates.length + 1;
    const [currentStep, setCurrentStep] = useState(0);
    const [templateInputs, setTemplateInputs] = useState<Record<number, Record<string, unknown>>>(
        {},
    );
    const [inputValidationStates, setInputValidationStates] = useState<Record<number, boolean>>({});
    const [templateConfigs, setTemplateConfigs] = useState<
        Record<number, Record<string, Record<string, unknown>>>
    >({});

    const updateQuestionTemplate = useUpdateQuestionTemplate();
    const generateFromTemplate = useGenerateFromTemplate();
    const [generatedQuestion, setGeneratedQuestion] = useState<{
        question: Question;
        forStep: number;
    } | null>(null);

    // Initialize template inputs when modal opens or questionTemplates change.
    // Only populates missing indices so existing user data is preserved on re-open.
    useEffect(() => {
        if (open) {
            setTemplateInputs((prev) => {
                const next = { ...prev };
                questionTemplates.forEach((_, i) => {
                    if (!(i in next)) next[i] = {};
                });
                return next;
            });
            setInputValidationStates((prev) => {
                const next = { ...prev };
                questionTemplates.forEach((_, i) => {
                    if (!(i in next)) next[i] = true;
                });
                return next;
            });
            setTemplateConfigs((prev) => {
                const next = { ...prev };
                questionTemplates.forEach((qt, i) => {
                    if (!(i in next)) {
                        next[i] =
                            (qt.input_data_config as
                                | Record<string, Record<string, unknown>>
                                | undefined) ?? {};
                    }
                });
                return next;
            });
        }
    }, [open, questionTemplates]);

    // Form for metadata step
    const metadataForm = useForm<MetadataFormValues>({
        resolver: zodResolver(metadataFormSchema),
        defaultValues: {
            title: `${assessmentTemplateTitle} - Assessment`,
            description: "",
        },
    });

    // Closes the modal without resetting state
    const handleClose = useCallback(() => {
        generateFromTemplate.cancel();
        onOpenChange(false);
    }, [onOpenChange, generateFromTemplate]);

    const handleSaveConfigForStep = (idx: number) => {
        const qt = questionTemplates[idx];
        const config = templateConfigs[idx] ?? {};
        updateQuestionTemplate.mutate(
            {
                templateId: qt.id,
                data: {
                    input_data_config: Object.keys(config).length > 0 ? config : null,
                },
            },
            {
                onSuccess: () => toast.success("Input config saved"),
                onError: (error) => toast.error(`Failed to save config: ${error.message}`),
            },
        );
    };

    // Handles navigation to the next step with validation
    const handleNext = async () => {
        if (currentStep === 0) {
            const isValid = await metadataForm.trigger();
            if (isValid) {
                generateFromTemplate.cancel();
                setGeneratedQuestion(null);
                setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
            }
        } else {
            const templateIndex = currentStep - 1;
            const isCurrentStepValid = inputValidationStates[templateIndex] ?? true;
            if (isCurrentStepValid) {
                generateFromTemplate.cancel();
                setGeneratedQuestion(null);
                setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
            }
        }
    };

    // Handles navigation to the previous step
    const handleBack = () => {
        generateFromTemplate.cancel();
        setGeneratedQuestion(null);
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleGenerateQuestion = () => {
        const qt = questionTemplates[templateIndex];
        if (!qt) return;
        generateFromTemplate.mutate(
            { templateId: qt.id, data: { input_data: templateInputs[templateIndex] ?? {} } },
            {
                onSuccess: (data) => setGeneratedQuestion({ question: data, forStep: currentStep }),
                onError: (error) => {
                    if (isAbortError(error)) return;
                    toast.error(`Failed to generate question: ${error.message}`);
                },
            },
        );
    };

    // Completes the wizard and creates the assessment
    // Validates all inputs and calls the onInstantiate callback
    const handleComplete = async () => {
        // Build question inputs array from templateInputs
        const questionInputs: Array<Record<string, unknown>> = questionTemplates.map(
            (_, index) => templateInputs[index] || {},
        );

        // Get metadata values
        const metadata = metadataForm.getValues();

        try {
            await onInstantiate(
                metadata.title.trim(),
                metadata.description?.trim() || undefined,
                questionInputs,
            );
            setCurrentStep(0);
            metadataForm.reset();
            setTemplateInputs({});
            setTemplateConfigs({});
            setInputValidationStates({});
            setGeneratedQuestion(null);
            onOpenChange(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message || "Failed to create assessment");
            } else {
                toast.error("Failed to create assessment");
            }
        }
    };

    const progress = ((currentStep + 1) / totalSteps) * 100;
    const isLastStep = currentStep === totalSteps - 1;
    const templateIndex = currentStep - 1;
    const isCurrentStepValid = currentStep === 0 || (inputValidationStates[templateIndex] ?? true);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Instantiate Assessment</DialogTitle>
                    <DialogDescription>
                        Create a new assessment from this template. Step {currentStep + 1} of{" "}
                        {totalSteps}
                    </DialogDescription>
                </DialogHeader>

                <Progress
                    value={progress}
                    className="h-2"
                    aria-label={`Progress: Step ${currentStep + 1} of ${totalSteps}`}
                />

                <div className="py-4">
                    {/* Loading state while polling for assessment creation */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm">Generating assessment, please wait...</p>
                            {onCancelGeneration && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancelGeneration}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Step 0: Assessment Metadata */}
                    {!isLoading && currentStep === 0 && (
                        <Form {...metadataForm}>
                            <div className="space-y-4">
                                <FormField
                                    control={metadataForm.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assessment Title *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter assessment title"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={metadataForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter description"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Form>
                    )}

                    {/* Steps 1+: Input data for each template */}
                    {!isLoading && currentStep > 0 && questionTemplates[templateIndex] && (
                        <div className="space-y-4">
                            <QuestionTemplateContent
                                template={questionTemplates[templateIndex]}
                                index={templateIndex}
                            />

                            <InputDataCard
                                key={templateIndex}
                                entryFunctionParams={
                                    questionTemplates[templateIndex].entry_function_params
                                }
                                initialValues={templateInputs[templateIndex]}
                                inputDataConfig={templateConfigs[templateIndex] ?? {}}
                                onInputDataConfigChange={(cfg) =>
                                    setTemplateConfigs((prev) => ({
                                        ...prev,
                                        [templateIndex]: cfg,
                                    }))
                                }
                                onInputDataChange={(data) => {
                                    setTemplateInputs((prev) => ({
                                        ...prev,
                                        [templateIndex]: data,
                                    }));
                                }}
                                onValidationChange={(isValid) => {
                                    setInputValidationStates((prev) => ({
                                        ...prev,
                                        [templateIndex]: isValid,
                                    }));
                                }}
                                onSave={() => handleSaveConfigForStep(templateIndex)}
                                isSaving={updateQuestionTemplate.isPending}
                                canEdit={canEdit}
                            />

                            {/* Test Generate section */}
                            {generatedQuestion && generatedQuestion.forStep === currentStep ? (
                                <div className="space-y-2">
                                    <QuestionDisplay
                                        question={generatedQuestion.question}
                                        questionType={generatedQuestion.question.question_type}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setGeneratedQuestion(null)}
                                            aria-label="Dismiss question preview"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Dismiss Preview
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-end items-center gap-2">
                                    {generateFromTemplate.isPending ? (
                                        <>
                                            <Button type="button" disabled size="sm">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Generating...
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => generateFromTemplate.cancel()}
                                                aria-label="Cancel"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleGenerateQuestion}
                                            disabled={
                                                !(inputValidationStates[templateIndex] ?? true)
                                            }
                                            aria-label="Generate question"
                                        >
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            Generate Question (Optional)
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isLoading}
                        aria-label="Go to previous step"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onCancelGeneration?.();
                                handleClose();
                            }}
                            aria-label="Cancel and close modal"
                        >
                            Cancel
                        </Button>
                        {isLastStep ? (
                            <Button
                                onClick={handleComplete}
                                disabled={isLoading}
                                aria-label="Create assessment from template"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Create Assessment
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={isLoading || !isCurrentStepValid}
                                aria-label="Go to next step"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
