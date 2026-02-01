// CreateFromTemplateModal - Modal for generating a question from a question template

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useGenerateFromTemplate } from "../useQuestionTemplates";
import { QuestionDisplay } from "@/features/question-builder/components/QuestionDisplay";
import { SaveQuestionModal } from "@/features/question-builder/components";
import { InputDataCard } from "@/shared/components";
import { useUserStore } from "@/shared/stores/user.store";
import {
    useAddQuestionToAssessment,
    useCreateAssessment,
} from "@/features/assessments/useAssessments";
import type { Question, QuestionTemplateResponse } from "@/api/models";
import type { QuestionTemplateConfig } from "../types";

// Schema for the form
const templateFormSchema = z.object({
    inputDataJson: z.string(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface CreateFromTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: QuestionTemplateResponse | null;
}

export function CreateFromTemplateModal({
    open,
    onOpenChange,
    template,
}: CreateFromTemplateModalProps) {
    const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const user = useUserStore((state) => state.user);
    const rootFolderId = useUserStore((state) => state.rootFolderId);
    const generateQuestion = useGenerateFromTemplate();
    const createAssessment = useCreateAssessment();
    const addQuestion = useAddQuestionToAssessment();

    const template_config = template?.template_config as unknown as QuestionTemplateConfig;

    // Form setup
    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            inputDataJson: "",
        },
    });

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
        setGeneratedQuestion(null);
        setShowSaveModal(false);
    };

    const handleGenerate = () => {
        if (!template) return;

        const values = form.getValues();

        let inputData: Record<string, unknown> = {};
        if (values.inputDataJson.trim()) {
            try {
                inputData = JSON.parse(values.inputDataJson);
            } catch {
                toast.error("Invalid JSON format");
                return;
            }
        }

        generateQuestion.mutate(
            {
                templateId: template.id,
                data: { input_data: inputData },
            },
            {
                onSuccess: (data) => {
                    setGeneratedQuestion(data);
                    toast.success("Question generated successfully");
                },
                onError: (error) => {
                    toast.error(`Failed to generate question: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToNewAssessment = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!generatedQuestion || !user || !template) return;

        createAssessment.mutate(
            {
                owner_id: user.id,
                folder_id: folderId,
                title,
                description,
            },
            {
                onSuccess: (newAssessment) => {
                    handleSaveToExistingAssessment(newAssessment.id);
                },
                onError: (error) => {
                    toast.error(`Failed to create assessment: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToExistingAssessment = (assessmentId: string) => {
        if (!generatedQuestion || !user || !template) return;

        addQuestion.mutate(
            {
                assessmentId,
                data: {
                    question: {
                        owner_id: user.id,
                        template_id: template.id,
                        question_type: generatedQuestion.question_type,
                        question_text: generatedQuestion.text,
                        additional_data: {
                            options: (generatedQuestion.options || []) as string[],
                            correct_indices: generatedQuestion.correct_indices || [],
                            answer: String(generatedQuestion.answer || ""),
                        },
                    },
                },
            },
            {
                onSuccess: () => {
                    toast.success("Question added to assessment");
                    setShowSaveModal(false);
                    handleClose();
                },
                onError: (error) => {
                    toast.error(`Failed to add question: ${error.message}`);
                },
            },
        );
    };

    if (!template) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Generate Question from Template</DialogTitle>
                        <DialogDescription>
                            Provide input data to generate a specific question from this template.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <div className="space-y-4">
                            {/* Template Config Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <p className="text-sm">{template.question_text}</p>
                                    </CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">
                                                Entry Function:
                                            </span>
                                            <span className="ml-2 font-mono">
                                                {template_config.entry_function as string}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Output Type:
                                            </span>
                                            <span className="ml-2">
                                                {template_config.question_spec.output_type}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Question Type:
                                            </span>
                                            <span className="ml-2">
                                                {template_config.question_spec.question_type}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Distractors:
                                            </span>
                                            <span className="ml-2">
                                                {template_config.generation_options.num_distractors}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Input Data */}
                            {!generatedQuestion && (
                                <InputDataCard
                                    control={form.control}
                                    onInputDataChange={(value) =>
                                        form.setValue("inputDataJson", value)
                                    }
                                    title="Input Data"
                                />
                            )}

                            {/* Generated Question Preview */}
                            {generatedQuestion && (
                                <QuestionDisplay
                                    question={generatedQuestion}
                                    questionType={generatedQuestion.question_type}
                                />
                            )}
                        </div>
                    </Form>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        {!generatedQuestion ? (
                            <Button onClick={handleGenerate} disabled={generateQuestion.isPending}>
                                {generateQuestion.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate Question
                                    </>
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setGeneratedQuestion(null)}
                                >
                                    Try Again
                                </Button>
                                <Button onClick={() => setShowSaveModal(true)}>
                                    Save Question
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Save Question Modal */}
            <SaveQuestionModal
                open={showSaveModal}
                onOpenChange={setShowSaveModal}
                ownerId={user?.id || ""}
                currentFolderId={rootFolderId || ""}
                onSaveToNew={handleSaveToNewAssessment}
                onSaveToExisting={handleSaveToExistingAssessment}
                isLoading={createAssessment.isPending || addQuestion.isPending}
            />
        </>
    );
}
