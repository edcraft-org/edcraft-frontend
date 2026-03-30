// QuestionBuilderPage - Generate questions from code

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2, Wand2, Save, ArrowLeft, X } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { useAuthDialogStore } from "@/shared/stores/auth-dialog.store";
import {
    useAddQuestionToAssessment,
    useCreateAssessment,
} from "@/features/assessments/useAssessments";
import {
    useCreateQuestionBank,
    useAddQuestionToQuestionBank,
} from "@/features/question-banks/useQuestionBanks";
import { useAnalyseCode } from "@/shared/hooks/useCodeAnalysis";
import { api } from "@/api/client";
import { pollJob, isAbortError } from "@/api/pollJob";
import type { TargetSelection } from "@/types/frontend.types";
import {
    CodeInputCard,
    TargetSelectionCard,
    QuestionConfigCard,
    InputDataCard,
} from "@/shared/components";
import { SaveQuestionModal, QuestionDisplay } from "./components";
import { flattenTarget } from "@/shared/components/target-selector/utils/transformTarget";
import { generatedQuestionToRequestData } from "@/shared/utils/questionUtils";
import type { CodeInfoOutput, Question, QuestionGenerationRequest } from "@/api/models";

// Schema for the question builder form
const questionBuilderSchema = z.object({
    code: z.string().min(1, "Code is required"),
    entryFunction: z.string().min(1, "Entry function is required"),
    outputType: z.enum(["first", "last", "list", "count"]),
    questionType: z.enum(["mcq", "mrq", "short_answer"]),
    numDistractors: z.number().min(1).max(10),
    inputData: z.record(z.string(), z.unknown()).optional(),
});

type QuestionBuilderFormValues = z.infer<typeof questionBuilderSchema>;

function QuestionBuilderPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const destinationAssessmentId = searchParams.get("assessmentDestination");
    const destinationQuestionBankId = searchParams.get("questionBankDestination");

    const user = useUserStore((state) => state.user);
    const rootFolderId = useUserStore((state) => state.rootFolderId);
    const openAuthDialog = useAuthDialogStore((state) => state.setOpen);

    // Code analysis state
    const analyseCode = useAnalyseCode();
    const [codeInfo, setCodeInfo] = useState<CodeInfoOutput | undefined>(undefined);
    const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);
    const [isInputDataValid, setIsInputDataValid] = useState(true);

    // Question generation mutation
    const generateControllerRef = useRef<AbortController | null>(null);
    const generateQuestionMutation = useMutation({
        mutationFn: async (request: QuestionGenerationRequest) => {
            generateControllerRef.current?.abort();
            const controller = new AbortController();
            generateControllerRef.current = controller;
            const response =
                await api.generateQuestionQuestionGenerationGenerateQuestionPost(request);
            return pollJob<Question>(response.data.job_id, { signal: controller.signal });
        },
        onError: (error) => {
            if (isAbortError(error)) return;
        },
    });
    const cancelGenerate = useCallback(() => generateControllerRef.current?.abort(), []);

    const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(null);

    // Save modal state
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Ref for scrolling to preview
    const previewRef = useRef<HTMLDivElement>(null);

    // Cancel in-flight jobs on unmount
    useEffect(() => {
        return () => {
            analyseCode.cancel();
            generateControllerRef.current?.abort();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Mutations
    const addQuestion = useAddQuestionToAssessment();
    const createAssessment = useCreateAssessment();
    const createQuestionBank = useCreateQuestionBank();
    const addQuestionToQuestionBank = useAddQuestionToQuestionBank();

    // Form setup with react-hook-form
    const form = useForm<QuestionBuilderFormValues>({
        resolver: zodResolver(questionBuilderSchema),
        defaultValues: {
            code: "",
            entryFunction: "",
            outputType: "first",
            questionType: "mcq",
            numDistractors: 4,
            inputData: {},
        },
    });

    // Watch form values
    const code = form.watch("code");
    const entryFunction = form.watch("entryFunction");
    const questionType = form.watch("questionType");

    // Derive entry function params from CodeInfo
    const selectedFunction = codeInfo?.functions.find(
        (f) => f.name === entryFunction && f.is_definition,
    );
    const entryFunctionParams = selectedFunction
        ? {
              parameters: selectedFunction.parameters,
              has_var_args: false,
              has_var_kwargs: false,
          }
        : undefined;

    // Reset input data when entry function changes
    useEffect(() => {
        if (entryFunction) {
            form.setValue("inputData", {});
        }
    }, [entryFunction, form]);

    const handleAnalyseCode = () => {
        if (analyseCode.isPending) return;

        const currentCode = form.getValues("code");
        if (!currentCode.trim()) {
            toast.error("Please enter some code");
            return;
        }

        analyseCode.mutate(
            {
                code: currentCode,
            },
            {
                onSuccess: (data) => {
                    toast.success("Code analysed successfully");
                    setCodeInfo(data.code_info);
                    const currentEntryFunction = form.getValues("entryFunction");
                    const stillExists = data.code_info.functions.some(
                        (f) => f.name === currentEntryFunction && f.is_definition,
                    );
                    if (!stillExists) {
                        form.setValue("entryFunction", "");
                    }
                },
                onError: (error) => {
                    if (isAbortError(error)) return;
                    toast.error(`Code analysis failed: ${error.message}`);
                },
            },
        );
    };

    const handleCodeChange = (newCode: string) => {
        form.setValue("code", newCode);
    };

    const handleGenerateQuestion = () => {
        const values = form.getValues();

        if (!values.code.trim()) {
            toast.error("Please analyse your code first");
            return;
        }
        if (!targetSelection) {
            toast.error("Please select a target element");
            return;
        }
        if (!values.entryFunction) {
            toast.error("Please select an entry function");
            return;
        }

        const inputData = values.inputData || {};

        const request = {
            code: values.code,
            question_spec: {
                target: flattenTarget(targetSelection),
                output_type: values.outputType,
                question_type: values.questionType,
            },
            execution_spec: {
                entry_function: values.entryFunction,
                input_data: inputData,
            },
            generation_options: {
                num_distractors: values.numDistractors,
            },
        };

        generateQuestionMutation.mutate(request, {
            onSuccess: (data) => {
                setGeneratedQuestion(data);
                toast.success("Question generated successfully");
                previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            },
            onError: (error) => {
                if (isAbortError(error)) return;
                toast.error(`Failed to generate question: ${error.message}`);
            },
        });
    };

    const handleSaveToNewQuestionBank = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!generatedQuestion || !user) return;

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
        if (!generatedQuestion || !user) return;

        addQuestionToQuestionBank.mutate(
            {
                questionBankId,
                data: {
                    question: generatedQuestionToRequestData(generatedQuestion),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Question added to question bank");
                    setShowSaveModal(false);
                    navigate(`/question-banks/${questionBankId}`);
                },
                onError: (error) => {
                    toast.error(`Failed to add question: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToNewAssessment = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!generatedQuestion || !user) return;

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

    const handleSaveQuestionButton = () => {
        if (!user) {
            openAuthDialog(true);
            return;
        }
        if (destinationAssessmentId) {
            handleSaveToExistingAssessment(destinationAssessmentId);
        } else if (destinationQuestionBankId) {
            handleSaveToExistingQuestionBank(destinationQuestionBankId);
        } else {
            setShowSaveModal(true);
        }
    };

    const handleSaveToExistingAssessment = (assessmentId: string) => {
        if (!generatedQuestion || !user) return;

        addQuestion.mutate(
            {
                assessmentId,
                data: {
                    question: generatedQuestionToRequestData(generatedQuestion),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Question added to assessment");
                    setShowSaveModal(false);
                    navigate(`/assessments/${assessmentId}`);
                },
                onError: (error) => {
                    toast.error(`Failed to add question: ${error.message}`);
                },
            },
        );
    };

    return (
        <Form {...form}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Question Builder</h1>
                        <p className="text-muted-foreground mt-1">
                            Generate a question from code with specific input data
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Configuration */}
                    <div className="space-y-6">
                        {/* Code Input */}
                        <CodeInputCard
                            control={form.control}
                            code={code}
                            onCodeChange={handleCodeChange}
                            onAnalyseCode={handleAnalyseCode}
                            onCancelAnalysis={analyseCode.cancel}
                            isAnalysing={analyseCode.isPending}
                            hasExistingSelection={targetSelection !== null}
                            analysisError={
                                analyseCode.isError
                                    ? analyseCode.error?.message || "Code analysis failed"
                                    : null
                            }
                        />

                        {/* Target Selection - Only show after code analysis */}
                        {codeInfo && (
                            <TargetSelectionCard
                                codeInfo={codeInfo}
                                onTargetChange={setTargetSelection}
                            />
                        )}

                        {/* Question Configuration - Only show after target selection */}
                        {codeInfo && (
                            <QuestionConfigCard
                                control={form.control}
                                codeInfo={codeInfo}
                                questionType={questionType}
                            />
                        )}

                        {/* Input Data - Only show after entry function is selected */}
                        {entryFunctionParams && (
                            <InputDataCard
                                entryFunctionParams={entryFunctionParams}
                                onInputDataChange={(data) => {
                                    form.setValue("inputData", data);
                                }}
                                onValidationChange={setIsInputDataValid}
                                title="Step 4: Input Data"
                            />
                        )}

                        {/* Generate Button - Only show after configuration */}
                        {codeInfo &&
                            (generateQuestionMutation.isPending ? (
                                <div className="flex gap-2">
                                    <Button className="flex-1" disabled>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating Question...
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={cancelGenerate}
                                        aria-label="Cancel generation"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={handleGenerateQuestion}
                                    disabled={
                                        !targetSelection || !entryFunction || !isInputDataValid
                                    }
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate Question
                                </Button>
                            ))}
                    </div>

                    {/* Preview */}
                    <div ref={previewRef} className="space-y-6">
                        {generatedQuestion ? (
                            <>
                                <QuestionDisplay
                                    question={generatedQuestion}
                                    questionType={generatedQuestion.question_type}
                                />
                                {generateQuestionMutation.isError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                                            Error
                                        </h3>
                                        <p className="text-red-600 dark:text-red-400">
                                            {generateQuestionMutation.error?.message}
                                        </p>
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={handleSaveQuestionButton}
                                    disabled={
                                        createAssessment.isPending ||
                                        addQuestion.isPending ||
                                        createQuestionBank.isPending ||
                                        addQuestionToQuestionBank.isPending
                                    }
                                >
                                    {createAssessment.isPending ||
                                    addQuestion.isPending ||
                                    createQuestionBank.isPending ||
                                    addQuestionToQuestionBank.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Question
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center">
                                <CardContent className="text-center text-muted-foreground">
                                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium mb-2">Question Preview</p>
                                    <ol className="text-sm text-left list-decimal list-inside space-y-1">
                                        <li>Enter your algorithm code</li>
                                        <li>Click "Analyse Code" to parse the structure</li>
                                        <li>Select the target element to query</li>
                                        <li>Configure question parameters</li>
                                        <li>Provide input data for the question</li>
                                        <li>Click "Generate Question"</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

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
                    preSelectedAssessmentId={destinationAssessmentId || undefined}
                    preSelectedQuestionBankId={destinationQuestionBankId || undefined}
                    initialView={
                        destinationAssessmentId
                            ? "assessment"
                            : destinationQuestionBankId
                              ? "question-bank"
                              : "destination"
                    }
                />
            </div>
        </Form>
    );
}

export default QuestionBuilderPage;
