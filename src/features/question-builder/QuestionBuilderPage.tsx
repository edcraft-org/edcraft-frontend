// QuestionBuilderPage - Generate questions from code

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2, Wand2, Save, ArrowLeft } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
    useAddQuestionToAssessment,
    useCreateAssessment,
} from "@/features/assessments/useAssessments";
import { useAnalyseCode } from "@/shared/hooks/useCodeAnalysis";
import { api } from "@/api/client";
import type { TargetSelection } from "@/types/frontend.types";
import {
    CodeInputCard,
    TargetSelectionCard,
    QuestionConfigCard,
    InputDataCard,
} from "@/shared/components";
import { SaveQuestionModal, QuestionDisplay } from "./components";
import { flattenTarget } from "@/shared/components/target-selector/utils/transformTarget";
import type { CodeInfo, Question, QuestionGenerationRequest } from "@/api/models";

// Schema for the question builder form
const questionBuilderSchema = z.object({
    code: z.string().min(1, "Code is required"),
    entryFunction: z.string().min(1, "Entry function is required"),
    outputType: z.enum(["first", "last", "list", "count"]),
    questionType: z.enum(["mcq", "mrq", "short_answer"]),
    numDistractors: z.number().min(1).max(10),
    inputDataJson: z.string(),
});

type QuestionBuilderFormValues = z.infer<typeof questionBuilderSchema>;

function QuestionBuilderPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const destinationAssessmentId = searchParams.get("destination");
    const user = useUserStore((state) => state.user);
    const rootFolderId = useUserStore((state) => state.rootFolderId);

    // Code analysis state
    const analyseCode = useAnalyseCode();
    const [codeInfo, setCodeInfo] = useState<CodeInfo | undefined>(undefined);
    const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);

    // Question generation mutation
    const generateQuestionMutation = useMutation({
        mutationFn: (request: QuestionGenerationRequest) =>
            api.generateQuestionQuestionGenerationGenerateQuestionPost(request),
    });

    const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(null);

    // Save modal state
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Mutations
    const addQuestion = useAddQuestionToAssessment();
    const createAssessment = useCreateAssessment();

    // Form setup with react-hook-form
    const form = useForm<QuestionBuilderFormValues>({
        resolver: zodResolver(questionBuilderSchema),
        defaultValues: {
            code: "",
            entryFunction: "",
            outputType: "first",
            questionType: "mcq",
            numDistractors: 4,
            inputDataJson: "",
        },
    });

    // Watch form values
    const code = form.watch("code");
    const entryFunction = form.watch("entryFunction");
    const questionType = form.watch("questionType");

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
                    setTargetSelection(null);
                    form.setValue("entryFunction", "");
                },
                onError: (error) => {
                    toast.error(`Code analysis failed: ${error.message}`);
                },
            },
        );
    };

    const handleCodeChange = (newCode: string) => {
        form.setValue("code", newCode);
        // Reset analysis when code changes
        if (codeInfo) {
            setCodeInfo(undefined);
            setTargetSelection(null);
            form.setValue("entryFunction", "");
            setGeneratedQuestion(null);
        }
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

        // Parse input data JSON
        let inputData: Record<string, unknown> = {};
        if (values.inputDataJson.trim()) {
            try {
                inputData = JSON.parse(values.inputDataJson);
            } catch {
                toast.error("Invalid JSON format in input data");
                return;
            }
        }

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
                setGeneratedQuestion(data.data);
                toast.success("Question generated successfully");
            },
            onError: (error) => {
                toast.error(`Failed to generate question: ${error.message}`);
            },
        });
    };

    const handleSaveToNewAssessment = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!generatedQuestion || !user) return;

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
        if (!generatedQuestion || !user) return;

        addQuestion.mutate(
            {
                assessmentId,
                data: {
                    question: {
                        owner_id: user.id,
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
                    navigate(-1);
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
                            isAnalysing={analyseCode.isPending}
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

                        {/* Input Data - Only show after configuration */}
                        {codeInfo && (
                            <InputDataCard
                                control={form.control}
                                onInputDataChange={(value) => form.setValue("inputDataJson", value)}
                                title="Step 4: Input Data"
                            />
                        )}

                        {/* Generate Button - Only show after configuration */}
                        {codeInfo && (
                            <Button
                                className="w-full"
                                onClick={handleGenerateQuestion}
                                disabled={
                                    generateQuestionMutation.isPending ||
                                    !targetSelection ||
                                    !entryFunction
                                }
                            >
                                {generateQuestionMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating Question...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate Question
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="space-y-6">
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
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={createAssessment.isPending || addQuestion.isPending}
                                >
                                    {createAssessment.isPending || addQuestion.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save to Assessment
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center justify-center">
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

                {/* Save Modal */}
                <SaveQuestionModal
                    open={showSaveModal}
                    onOpenChange={setShowSaveModal}
                    ownerId={user?.id || ""}
                    currentFolderId={rootFolderId || ""}
                    onSaveToNew={handleSaveToNewAssessment}
                    onSaveToExisting={handleSaveToExistingAssessment}
                    isLoading={createAssessment.isPending || addQuestion.isPending}
                    preSelectedAssessmentId={destinationAssessmentId || undefined}
                />
            </div>
        </Form>
    );
}

export default QuestionBuilderPage;
