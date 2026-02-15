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
import {
    useCreateQuestionBank,
    useAddQuestionToQuestionBank,
} from "@/features/question-banks/useQuestionBanks";
import { generatedQuestionToRequestData } from "@/shared/utils/questionUtils";
import type { Question, QuestionTemplateResponse } from "@/api/models";

// Schema for the form
const templateFormSchema = z.object({
    inputData: z.record(z.string(), z.unknown()).optional(),
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
    const [isInputDataValid, setIsInputDataValid] = useState(true);

    const user = useUserStore((state) => state.user);
    const rootFolderId = useUserStore((state) => state.rootFolderId);
    const generateQuestion = useGenerateFromTemplate();
    const createAssessment = useCreateAssessment();
    const addQuestion = useAddQuestionToAssessment();
    const createQuestionBank = useCreateQuestionBank();
    const addQuestionToQuestionBank = useAddQuestionToQuestionBank();

    // Form setup
    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            inputData: {},
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
        const inputData = values.inputData || {};

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
                    question: generatedQuestionToRequestData(generatedQuestion, template.id),
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

    const handleSaveToNewQuestionBank = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!generatedQuestion || !user || !template) return;

        createQuestionBank.mutate(
            {
                folder_id: folderId,
                title,
                description,
            },
            {
                onSuccess: (newQuestionBank) => {
                    handleSaveToExistingQuestionBank(newQuestionBank.id);
                },
                onError: (error) => {
                    toast.error(`Failed to create question bank: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToExistingQuestionBank = (questionBankId: string) => {
        if (!generatedQuestion || !user || !template) return;

        addQuestionToQuestionBank.mutate(
            {
                questionBankId,
                data: {
                    question: generatedQuestionToRequestData(generatedQuestion, template.id),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Question added to question bank");
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
                                                {template.entry_function}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Output Type:
                                            </span>
                                            <span className="ml-2">
                                                {template.output_type}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Question Type:
                                            </span>
                                            <span className="ml-2">
                                                {template.question_type}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Distractors:
                                            </span>
                                            <span className="ml-2">
                                                {template.num_distractors}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Input Data */}
                            {!generatedQuestion && (
                                <InputDataCard
                                    entryFunctionParams={template.entry_function_params}
                                    onInputDataChange={(data) => {
                                        form.setValue("inputData", data);
                                    }}
                                    onValidationChange={setIsInputDataValid}
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
                            <Button
                                onClick={handleGenerate}
                                disabled={generateQuestion.isPending || !isInputDataValid}
                            >
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
                onSaveToNewAssessment={handleSaveToNewAssessment}
                onSaveToExistingAssessment={handleSaveToExistingAssessment}
                onSaveToNewQuestionBank={handleSaveToNewQuestionBank}
                onSaveToExistingQuestionBank={handleSaveToExistingQuestionBank}
                isLoadingAssessment={createAssessment.isPending || addQuestion.isPending}
                isLoadingQuestionBank={
                    createQuestionBank.isPending || addQuestionToQuestionBank.isPending
                }
            />
        </>
    );
}
