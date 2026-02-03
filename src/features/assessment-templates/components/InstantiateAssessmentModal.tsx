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
    const [templateInputs, setTemplateInputs] = useState<Record<number, Record<string, unknown>>>(
        {},
    );
    const [inputValidationStates, setInputValidationStates] = useState<Record<number, boolean>>(
        {},
    );

    // Initialize template inputs when modal opens or questionTemplates change
    useEffect(() => {
        if (open) {
            setTemplateInputs(Object.fromEntries(questionTemplates.map((_, i) => [i, {}])));
            setInputValidationStates(Object.fromEntries(questionTemplates.map((_, i) => [i, true])));
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

    // Closes the modal and resets all form state
    const handleClose = useCallback(() => {
        onOpenChange(false);
        setCurrentStep(0);
        metadataForm.reset();
        setTemplateInputs({});
    }, [onOpenChange, metadataForm]);

    // Handles navigation to the next step with validation
    const handleNext = async () => {
        if (currentStep === 0) {
            const isValid = await metadataForm.trigger();
            if (isValid) {
                setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
            }
        } else {
            const templateIndex = currentStep - 1;
            const isCurrentStepValid = inputValidationStates[templateIndex] ?? true;
            if (isCurrentStepValid) {
                setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
            }
        }
    };

    // Handles navigation to the previous step
    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
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
            handleClose();
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
    const isCurrentStepValid =
        currentStep === 0 || (inputValidationStates[templateIndex] ?? true);

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

                            <InputDataCard
                                key={templateIndex}
                                entryFunctionParams={questionTemplates[templateIndex].entry_function_params}
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
                            />
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
