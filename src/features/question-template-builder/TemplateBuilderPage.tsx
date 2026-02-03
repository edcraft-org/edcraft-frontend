// TemplateBuilderPage - Create question templates (similar to QuestionBuilder but without input data)

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, Wand2, Save, ArrowLeft } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { useFolderStore } from "@/shared/stores/folder.store";
import { useGenerateTemplatePreview } from "./useTemplateBuilders";
import {
    useCreateAssessmentTemplate,
    useAddQuestionTemplateToAssessmentTemplate,
} from "@/features/assessment-templates/useAssessmentTemplates";
import { useAnalyseCode } from "@/shared/hooks/useCodeAnalysis";
import type { TargetSelection } from "@/types/frontend.types";
import { CodeInputCard, TargetSelectionCard, QuestionConfigCard } from "@/shared/components";
import { SaveTemplateModal } from "./components";
import { TemplatePreview } from "./TemplatePreview";
import { flattenTarget } from "@/shared/components/target-selector/utils/transformTarget";
import type { CodeInfo, TemplatePreviewResponse } from "@/api/models";
import type { QuestionTemplateConfig } from "../question-templates";

// Schema for the template builder form
const templateBuilderSchema = z.object({
    templateDescription: z.string().optional(),
    code: z.string(),
    entryFunction: z.string(),
    outputType: z.enum(["first", "last", "list", "count"]),
    questionType: z.enum(["mcq", "mrq", "short_answer"]),
    numDistractors: z.number().min(1).max(10),
});

type TemplateBuilderFormValues = z.infer<typeof templateBuilderSchema>;

function TemplateBuilderPage() {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const currentFolderId = useFolderStore((state) => state.currentFolderId);

    // Code analysis state
    const analyseCode = useAnalyseCode();
    const [codeInfo, setCodeInfo] = useState<CodeInfo | undefined>(undefined);
    const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);

    // Preview and save state
    const [preview, setPreview] = useState<TemplatePreviewResponse | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Ref for scrolling to preview
    const previewRef = useRef<HTMLDivElement>(null);

    // Mutations
    const generatePreview = useGenerateTemplatePreview();
    const createAssessmentTemplate = useCreateAssessmentTemplate();
    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();

    // Form setup with react-hook-form
    const form = useForm<TemplateBuilderFormValues>({
        resolver: zodResolver(templateBuilderSchema),
        defaultValues: {
            templateDescription: "",
            code: "",
            entryFunction: "",
            outputType: "first",
            questionType: "mcq",
            numDistractors: 4,
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
            setPreview(null);
        }
    };

    const handleGeneratePreview = () => {
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

        generatePreview.mutate(
            {
                code: values.code,
                entry_function: values.entryFunction,
                question_spec: {
                    target: flattenTarget(targetSelection),
                    output_type: values.outputType,
                    question_type: values.questionType,
                },
                generation_options: {
                    num_distractors: values.numDistractors,
                },
            },
            {
                onSuccess: (data) => {
                    setPreview(data);
                    toast.success("Template preview generated");
                    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                },
                onError: (error) => {
                    toast.error(`Failed to generate preview: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToNewBank = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!preview || !user) return;

        createAssessmentTemplate.mutate(
            {
                owner_id: user.id,
                folder_id: folderId,
                title,
                description,
            },
            {
                onSuccess: (newAssessmentTemplate) => {
                    handleSaveToExisting(newAssessmentTemplate.id);
                },
                onError: (error) => {
                    toast.error(`Failed to create template bank: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToExisting = (assessmentTemplateId: string) => {
        if (!preview || !user) return;

        const values = form.getValues();

        addQuestionTemplate.mutate(
            {
                templateId: assessmentTemplateId,
                data: {
                    question_template: {
                        owner_id: user.id,
                        question_type: values.questionType,
                        question_text: preview.question_text,
                        description: values.templateDescription || undefined,
                        template_config:
                            preview.template_config as unknown as QuestionTemplateConfig,
                    },
                },
            },
            {
                onSuccess: () => {
                    toast.success("Template added successfully");
                    setShowSaveModal(false);
                    navigate(`/assessment-templates/${assessmentTemplateId}`);
                },
                onError: (error) => {
                    toast.error(`Failed to add template: ${error.message}`);
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
                        <h1 className="text-2xl font-semibold">Template Builder</h1>
                        <p className="text-muted-foreground mt-1">
                            Create a reusable question template from code
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Configuration */}
                    <div className="space-y-6">
                        {/* Template Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Template Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="templateDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe what this template generates..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

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

                        {/* Generate Button - Only show after configuration */}
                        {codeInfo && (
                            <Button
                                className="w-full"
                                onClick={handleGeneratePreview}
                                disabled={
                                    generatePreview.isPending || !targetSelection || !entryFunction
                                }
                            >
                                {generatePreview.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating Preview...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate Template Preview
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Preview */}
                    <div ref={previewRef} className="space-y-6">
                        {preview ? (
                            <>
                                <TemplatePreview preview={preview} />
                                <Button
                                    className="w-full"
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={
                                        createAssessmentTemplate.isPending ||
                                        addQuestionTemplate.isPending
                                    }
                                >
                                    {createAssessmentTemplate.isPending ||
                                    addQuestionTemplate.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Template
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center justify-center">
                                <CardContent className="text-center text-muted-foreground">
                                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium mb-2">Template Preview</p>
                                    <ol className="text-sm text-left list-decimal list-inside space-y-1">
                                        <li>Enter your algorithm code</li>
                                        <li>Click "Analyse Code" to parse the structure</li>
                                        <li>Select the target element to query</li>
                                        <li>Configure question parameters</li>
                                        <li>Click "Generate Template Preview"</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Save Modal */}
                <SaveTemplateModal
                    open={showSaveModal}
                    onOpenChange={setShowSaveModal}
                    ownerId={user?.id || ""}
                    currentFolderId={currentFolderId || ""}
                    onSaveToNew={handleSaveToNewBank}
                    onSaveToExisting={handleSaveToExisting}
                    isLoading={createAssessmentTemplate.isPending || addQuestionTemplate.isPending}
                />
            </div>
        </Form>
    );
}

export default TemplateBuilderPage;
