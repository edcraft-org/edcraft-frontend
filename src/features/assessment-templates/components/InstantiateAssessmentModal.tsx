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
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { InputDataCard } from "@/shared/components";
import type { AssessmentTemplateQuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateContent } from "@/components/QuestionTemplateContent";

// Validates a JSON string input
const validateJsonInput = (inputData: string): boolean => {
    const trimmed = inputData.trim();
    if (!trimmed) return true; // Empty is allowed

    try {
        JSON.parse(trimmed);
        return true;
    } catch {
        toast.error("Invalid JSON format");
        return false;
    }
};

// Safely parses JSON input, returning empty object for empty strings
const parseJsonInput = (inputData: string): Record<string, unknown> => {
    const trimmed = inputData.trim();
    if (!trimmed) return {};

    try {
        const parsed = JSON.parse(trimmed);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
};

// Schema for metadata step
const metadataFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
});

// Schema for template input data step
const templateInputFormSchema = z.object({
    inputDataJson: z.string(),
});

type MetadataFormValues = z.infer<typeof metadataFormSchema>;
type TemplateInputFormValues = z.infer<typeof templateInputFormSchema>;

interface InstantiateAssessmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assessmentTemplateTitle: string;
    questionTemplates: AssessmentTemplateQuestionTemplateResponse[];
    onInstantiate: (
        title: string,
        description: string | undefined,
        questionInputs: Array<Record<string, unknown>>,
    ) => Promise<void>;
    isLoading?: boolean;
}

export function InstantiateAssessmentModal({
    open,
    onOpenChange,
    assessmentTemplateTitle,
    questionTemplates,
    onInstantiate,
    isLoading,
}: InstantiateAssessmentModalProps) {
    const totalSteps = questionTemplates.length + 1;
    const [currentStep, setCurrentStep] = useState(0);
    const [templateInputs, setTemplateInputs] = useState<Record<number, string>>({});

    // Initialize template inputs when modal opens or questionTemplates change
    useEffect(() => {
        if (open) {
            setTemplateInputs(Object.fromEntries(questionTemplates.map((_, i) => [i, ""])));
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

    // Form for template input step
    const templateInputForm = useForm<TemplateInputFormValues>({
        resolver: zodResolver(templateInputFormSchema),
        defaultValues: {
            inputDataJson: "",
        },
    });

    // Closes the modal and resets all form state
    const handleClose = useCallback(() => {
        onOpenChange(false);
        setCurrentStep(0);
        metadataForm.reset();
        templateInputForm.reset();
    }, [onOpenChange, metadataForm, templateInputForm]);

    // Saves current template input to state
    const saveCurrentTemplateInput = useCallback(() => {
        if (currentStep > 0) {
            const inputData = templateInputForm.getValues("inputDataJson");
            setTemplateInputs((prev) => ({
                ...prev,
                [currentStep - 1]: inputData,
            }));
        }
    }, [currentStep, templateInputForm]);

    // Handles navigation to the next step with validation
    const handleNext = async () => {
        let isValid = false;

        if (currentStep === 0) {
            isValid = await metadataForm.trigger();
        } else {
            const inputData = templateInputForm.getValues("inputDataJson");
            isValid = validateJsonInput(inputData);

            if (!isValid) return;

            saveCurrentTemplateInput();
        }

        if (isValid) {
            setCurrentStep((prev) => {
                const next = Math.min(prev + 1, totalSteps - 1);
                if (next > 0) {
                    templateInputForm.setValue("inputDataJson", templateInputs[next - 1] || "");
                }
                return next;
            });
        }
    };

    // Handles navigation to the previous step
    const handleBack = () => {
        saveCurrentTemplateInput();

        setCurrentStep((prev) => {
            const next = Math.max(prev - 1, 0);
            if (next > 0) {
                templateInputForm.setValue("inputDataJson", templateInputs[next - 1] || "");
            }
            return next;
        });
    };

    // Completes the wizard and creates the assessment
    // Validates all inputs and calls the onInstantiate callback
    const handleComplete = async () => {
        // Validate final step JSON
        const inputData = templateInputForm.getValues("inputDataJson");
        if (!validateJsonInput(inputData)) {
            return;
        }

        // Save final template input
        const templateIndex = currentStep - 1;
        const finalInputs = {
            ...templateInputs,
            [templateIndex]: inputData,
        };

        // Build question inputs array by parsing all template inputs
        const questionInputs: Array<Record<string, unknown>> = questionTemplates.map((_, index) =>
            parseJsonInput(finalInputs[index] || ""),
        );

        // Get metadata values
        const metadata = metadataForm.getValues();

        try {
            await onInstantiate(
                metadata.title.trim(),
                metadata.description?.trim() || undefined,
                questionInputs,
            );
            handleClose();
            toast.success("Assessment created successfully");
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message || "Failed to create assessment");
            } else {
                toast.error("Failed to create assessment");
            }
        }
    };

    // Auto-save current input when user types to prevent data loss
    useEffect(() => {
        if (currentStep > 0) {
            const subscription = templateInputForm.watch(() => {
                saveCurrentTemplateInput();
            });
            return () => subscription.unsubscribe();
        }
    }, [currentStep, templateInputForm, saveCurrentTemplateInput]);

    const progress = ((currentStep + 1) / totalSteps) * 100;
    const isLastStep = currentStep === totalSteps - 1;
    const templateIndex = currentStep - 1;

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
                    {/* Step 0: Assessment Metadata */}
                    {currentStep === 0 && (
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
                    {currentStep > 0 && questionTemplates[templateIndex] && (
                        <div className="space-y-4">
                            <QuestionTemplateContent
                                template={questionTemplates[templateIndex]}
                                index={templateIndex}
                            />

                            <Form {...templateInputForm}>
                                <InputDataCard
                                    control={templateInputForm.control}
                                    onInputDataChange={(value) =>
                                        templateInputForm.setValue("inputDataJson", value)
                                    }
                                    title="Input Data"
                                />
                            </Form>
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
                            onClick={handleClose}
                            disabled={isLoading}
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
                                disabled={isLoading}
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
