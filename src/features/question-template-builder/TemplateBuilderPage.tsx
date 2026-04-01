// TemplateBuilderPage - Create question templates (similar to QuestionBuilder but without input data)

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ROUTES } from "@/router/paths";
import { isAbortError } from "@/api/pollJob";
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
import { Loader2, Wand2, Save, ArrowLeft, X } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { useAuthDialogStore } from "@/shared/stores/auth-dialog.store";
import { useFolderStore } from "@/shared/stores/folder.store";
import { useGenerateTemplatePreview } from "./useTemplateBuilders";
import {
    useCreateAssessmentTemplate,
    useAddQuestionTemplateToAssessmentTemplate,
} from "@/features/assessment-templates/useAssessmentTemplates";
import {
    useInsertQuestionTemplateIntoBank,
    useCreateQuestionTemplateBank,
} from "@/features/question-template-banks/useQuestionTemplateBanks";
import {
    useQuestionTemplate,
    useUpdateQuestionTemplate,
} from "@/features/question-templates/useQuestionTemplates";
import { useAnalyseCode } from "@/shared/hooks/useCodeAnalysis";
import type { TargetSelection } from "@/types/frontend.types";
import {
    CodeInputCard,
    TargetSelectionCard,
    QuestionConfigCard,
    InputDataCard,
} from "@/shared/components";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { SaveTemplateModal, QuestionTextTemplateCard } from "./components";
import { TemplatePreview } from "./TemplatePreview";
import {
    flattenTarget,
    unflattenTarget,
} from "@/shared/components/target-selector/utils/transformTarget";
import type { CodeInfoOutput, EntryFunctionParams, TemplatePreviewResponse } from "@/api/models";

// Schema for the template builder form
const templateBuilderSchema = z.object({
    templateDescription: z.string().optional(),
    code: z.string().min(1, "Please enter some code"),
    entryFunction: z.string().min(1, "Please select an entry function"),
    outputType: z.enum(["first", "last", "list", "count"]),
    questionType: z.enum(["mcq", "mrq", "short_answer"]),
    numDistractors: z.number().min(1).max(10),
});

type TemplateBuilderFormValues = z.infer<typeof templateBuilderSchema>;

function TemplateBuilderPage() {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const openAuthDialog = useAuthDialogStore((state) => state.setOpen);
    const currentFolderId = useFolderStore((state) => state.currentFolderId);

    const [searchParams] = useSearchParams();
    const templateId = searchParams.get("templateId");
    const destinationAssessmentTemplateId = searchParams.get("assessmentTemplateId");
    const destinationTemplateBankId = searchParams.get("bankId");
    const isEditMode = Boolean(templateId);

    // Fetch template data if in edit mode
    const { data: existingTemplate, isLoading: loadingTemplate } = useQuestionTemplate(
        templateId || undefined,
    );

    // Code analysis state
    const analyseCode = useAnalyseCode();
    const [codeInfo, setCodeInfo] = useState<CodeInfoOutput | undefined>(undefined);
    const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);
    const [targetSelectorKey, setTargetSelectorKey] = useState(0);

    // Preview and save state
    const [preview, setPreview] = useState<TemplatePreviewResponse | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Question text template state
    const [templateMode, setTemplateMode] = useState<"basic" | "mustache">("basic");
    const [questionTextTemplate, setQuestionTextTemplate] = useState("");

    // Input data config state
    const [inputDataConfig, setInputDataConfig] = useState<Record<string, Record<string, unknown>>>(
        {},
    );

    // Preview input data state
    const [previewInputData, setPreviewInputData] = useState<Record<string, unknown>>({});

    // Ref for scrolling to preview
    const previewRef = useRef<HTMLDivElement>(null);

    // Cancel in-flight jobs on unmount
    useEffect(() => {
        return () => {
            analyseCode.cancel();
            generatePreview.cancel();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Mutations
    const generatePreview = useGenerateTemplatePreview();
    const createAssessmentTemplate = useCreateAssessmentTemplate();
    const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
    const createQuestionTemplateBank = useCreateQuestionTemplateBank();
    const insertQuestionTemplateIntoBank = useInsertQuestionTemplateIntoBank();
    const updateQuestionTemplate = useUpdateQuestionTemplate();

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

    // Derive entry function params from the selected entry function
    const selectedFunction = useMemo(
        () => codeInfo?.functions.find((f) => f.name === entryFunction && f.is_definition),
        [codeInfo, entryFunction],
    );
    const availableVars = useMemo(() => selectedFunction?.parameters ?? [], [selectedFunction]);
    const entryFunctionParams = useMemo<EntryFunctionParams | undefined>(
        () =>
            selectedFunction
                ? {
                      parameters: selectedFunction.parameters,
                      has_var_args: false,
                      has_var_kwargs: false,
                  }
                : undefined,
        [selectedFunction],
    );

    // Prepopulate form when editing existing template
    useEffect(() => {
        if (isEditMode && existingTemplate) {
            // Prepopulate form fields
            form.setValue("templateDescription", existingTemplate.description || "");
            form.setValue("code", existingTemplate.code);
            form.setValue("entryFunction", existingTemplate.entry_function);
            form.setValue(
                "outputType",
                existingTemplate.output_type as "first" | "last" | "list" | "count",
            );
            form.setValue(
                "questionType",
                existingTemplate.question_type as "mcq" | "mrq" | "short_answer",
            );
            form.setValue("numDistractors", existingTemplate.num_distractors || 4);

            // Pre-populate question text template
            setQuestionTextTemplate(existingTemplate.question_text_template ?? "");
            setTemplateMode(
                (existingTemplate.text_template_type as "basic" | "mustache") ?? "basic",
            );

            // Pre-populate input data config
            setInputDataConfig(
                (existingTemplate.input_data_config as Record<string, Record<string, unknown>>) ??
                    {},
            );

            // Use stored code_info if available, otherwise fall back to code analysis
            const storedCodeInfo = existingTemplate.code_info;
            const hasStoredCodeInfo = storedCodeInfo && Object.keys(storedCodeInfo).length > 0;

            const reconstructTarget = (template: typeof existingTemplate) => {
                try {
                    const sortedElements = [...template.target_elements]
                        .sort((a, b) => a.order - b.order)
                        .map(({ order: _, element_type, id_list, ...rest }) => ({
                            type: element_type,
                            id: id_list,
                            ...rest,
                        }));
                    setTargetSelection(unflattenTarget(sortedElements));
                } catch (error) {
                    console.error("Failed to reconstruct target:", error);
                    toast.error("Failed to load target selection");
                }
            };

            if (hasStoredCodeInfo) {
                setCodeInfo(storedCodeInfo);
                reconstructTarget(existingTemplate);
            } else {
                analyseCode.mutate(
                    { code: existingTemplate.code },
                    {
                        onSuccess: (data) => {
                            setCodeInfo(data.code_info);
                            reconstructTarget(existingTemplate);
                        },
                        onError: (error) => {
                            toast.error(`Failed to analyze code: ${error.message}`);
                        },
                    },
                );
            }
        }
    }, [isEditMode, existingTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

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
                    setTargetSelectorKey((k) => k + 1);
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

    const handleGeneratePreview = form.handleSubmit((values) => {
        if (!targetSelection) {
            toast.error("Please select a target element");
            return;
        }
        if (basicTemplateError) {
            toast.error("Please fix the question template error before generating");
            return;
        }

        const hasPreviewInputData = Object.keys(previewInputData).length > 0;

        generatePreview.mutate(
            {
                code: values.code,
                execution_spec: {
                    entry_function: values.entryFunction,
                    ...(hasPreviewInputData && { input_data: previewInputData }),
                },
                question_spec: {
                    target: flattenTarget(targetSelection),
                    output_type: values.outputType,
                    question_type: values.questionType,
                },
                generation_options: {
                    num_distractors: values.numDistractors,
                },
                ...(questionTextTemplate.trim() && {
                    question_text_template: questionTextTemplate,
                    text_template_type: templateMode,
                }),
            },
            {
                onSuccess: (data) => {
                    setPreview(data);
                    setQuestionTextTemplate(data.question_text_template);
                    setTemplateMode(data.text_template_type as "basic" | "mustache");
                    toast.success("Template preview generated");
                    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                },
                onError: (error) => {
                    if (isAbortError(error)) return;
                    toast.error(`Failed to generate preview: ${error.message}`);
                },
            },
        );
    });

    // Check that all {var} tokens in the basic template are valid parameters
    const invalidVars =
        templateMode === "basic"
            ? [...questionTextTemplate.matchAll(/\{([^}]+)\}/g)].filter(
                  (m) => !availableVars.includes(m[1]),
              )
            : [];
    const basicTemplateError =
        invalidVars.length > 0
            ? `Unknown variable${invalidVars.length > 1 ? "s" : ""}: ${invalidVars.map((m) => `{${m[1]}}`).join(", ")}`
            : null;

    // Build the core template payload from current state
    const buildTemplatePayload = () => {
        if (!codeInfo) {
            toast.error("Please analyse your code first");
            return null;
        }

        const values = form.getValues();

        if (!targetSelection) {
            toast.error("Please select a target element");
            return null;
        }
        if (!values.entryFunction) {
            toast.error("Please select an entry function");
            return null;
        }

        return {
            question_type: values.questionType,
            question_text_template: questionTextTemplate,
            text_template_type: templateMode,
            description: values.templateDescription || undefined,
            code: values.code,
            entry_function: values.entryFunction,
            output_type: values.outputType,
            num_distractors: values.numDistractors,
            target_elements: flattenTarget(targetSelection).map(({ type, id, ...rest }) => ({
                element_type: type,
                id_list: id,
                ...rest,
            })),
            code_info: codeInfo,
        };
    };

    const handleSaveButtonClick = () => {
        if (!user) {
            openAuthDialog(true);
            return;
        }
        if (!codeInfo) {
            toast.error("Please analyse your code first");
            return;
        }
        if (!targetSelection) {
            toast.error("Please select a target element");
            return;
        }
        form.handleSubmit(() => {
            if (isEditMode) {
                handleUpdateTemplate();
            } else if (destinationAssessmentTemplateId) {
                handleSaveToExistingAssessmentTemplate(destinationAssessmentTemplateId);
            } else if (destinationTemplateBankId) {
                handleSaveToExistingQuestionTemplateBank(destinationTemplateBankId);
            } else {
                setShowSaveModal(true);
            }
        })();
    };

    const handleSaveToNewAssessmentTemplate = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!user) return;

        createAssessmentTemplate.mutate(
            {
                folder_id: folderId,
                title,
                description,
            },
            {
                onSuccess: (newAssessmentTemplate) => {
                    handleSaveToExistingAssessmentTemplate(newAssessmentTemplate.id);
                },
                onError: (error) => {
                    toast.error(`Failed to create assessment template: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToExistingAssessmentTemplate = (assessmentTemplateId: string) => {
        if (!user) return;

        const payload = buildTemplatePayload();
        if (!payload) return;

        const templateData = {
            ...payload,
            input_data_config:
                Object.keys(inputDataConfig).length > 0 ? inputDataConfig : undefined,
        };

        addQuestionTemplate.mutate(
            {
                templateId: assessmentTemplateId,
                data: {
                    question_template: templateData,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Template added successfully");
                    setShowSaveModal(false);
                    navigate(ROUTES.ASSESSMENT_TEMPLATE(assessmentTemplateId));
                },
                onError: (error) => {
                    toast.error(`Failed to add template: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToNewQuestionTemplateBank = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!user) return;

        createQuestionTemplateBank.mutate(
            {
                folder_id: folderId,
                title,
                description,
            },
            {
                onSuccess: (newQuestionTemplateBank) => {
                    handleSaveToExistingQuestionTemplateBank(newQuestionTemplateBank.id);
                },
                onError: (error) => {
                    toast.error(`Failed to create question template bank: ${error.message}`);
                },
            },
        );
    };

    const handleSaveToExistingQuestionTemplateBank = (questionTemplateBankId: string) => {
        if (!user) return;

        const payload = buildTemplatePayload();
        if (!payload) return;

        const templateData = {
            ...payload,
            input_data_config:
                Object.keys(inputDataConfig).length > 0 ? inputDataConfig : undefined,
        };

        insertQuestionTemplateIntoBank.mutate(
            {
                templateBankId: questionTemplateBankId,
                data: {
                    question_template: templateData,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Template added to template bank successfully");
                    setShowSaveModal(false);
                    navigate(ROUTES.QUESTION_TEMPLATE_BANK(questionTemplateBankId));
                },
                onError: (error) => {
                    toast.error(`Failed to add template: ${error.message}`);
                },
            },
        );
    };

    const handleUpdateTemplate = () => {
        if (!user || !existingTemplate) return;

        const payload = buildTemplatePayload();
        if (!payload) return;

        updateQuestionTemplate.mutate(
            {
                templateId: existingTemplate.id,
                data: {
                    ...payload,
                    input_data_config:
                        Object.keys(inputDataConfig).length > 0 ? inputDataConfig : null,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Template updated successfully");
                    setShowSaveModal(false);

                    // Navigate back to the appropriate destination
                    if (destinationAssessmentTemplateId) {
                        navigate(ROUTES.ASSESSMENT_TEMPLATE(destinationAssessmentTemplateId));
                    } else if (destinationTemplateBankId) {
                        navigate(ROUTES.QUESTION_TEMPLATE_BANK(destinationTemplateBankId));
                    } else {
                        navigate(-1);
                    }
                },
                onError: (error) => {
                    toast.error(`Failed to update template: ${error.message}`);
                },
            },
        );
    };

    // Show loading while fetching template data
    if (isEditMode && loadingTemplate) {
        return <PageSkeleton />;
    }

    // Show error if template not found
    if (isEditMode && !loadingTemplate && !existingTemplate) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Template Not Found</h1>
                        <p className="text-muted-foreground mt-1">
                            The template you're trying to edit doesn't exist or you don't have
                            permission to access it.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditMode ? "Edit Template" : "Template Builder"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditMode
                                ? "Update this question template"
                                : "Create a reusable question template from code"}
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
                                key={targetSelectorKey}
                                codeInfo={codeInfo}
                                onTargetChange={setTargetSelection}
                                initialSelection={targetSelection}
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

                        {/* Question Text Template - Only show after code analysis */}
                        {codeInfo && (
                            <QuestionTextTemplateCard
                                mode={templateMode}
                                value={questionTextTemplate}
                                availableVars={availableVars}
                                entryFunction={entryFunction}
                                error={basicTemplateError}
                                onModeChange={(newMode) => {
                                    if (newMode === "mustache" && templateMode === "basic") {
                                        // {var} → {{var}}
                                        setQuestionTextTemplate((t) =>
                                            t.replace(/\{([^}]+)\}/g, "{{$1}}"),
                                        );
                                    } else if (newMode === "basic" && templateMode === "mustache") {
                                        // {{var}} → {var}
                                        setQuestionTextTemplate((t) =>
                                            t.replace(/\{\{([^}]+)\}\}/g, "{$1}"),
                                        );
                                    }
                                    setTemplateMode(newMode);
                                }}
                                onValueChange={setQuestionTextTemplate}
                            />
                        )}

                        {/* Input Data */}
                        {entryFunctionParams && (
                            <InputDataCard
                                entryFunctionParams={entryFunctionParams}
                                title="Input Data and Config (Optional)"
                                inputDataConfig={inputDataConfig}
                                onInputDataConfigChange={setInputDataConfig}
                                onInputDataChange={setPreviewInputData}
                                optional
                            />
                        )}

                        {/* Generate Button - Only show after configuration */}
                        {codeInfo &&
                            (generatePreview.isPending ? (
                                <div className="flex gap-2">
                                    <Button className="flex-1" disabled>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Generating Preview...
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={generatePreview.cancel}
                                        aria-label="Cancel generation"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={handleGeneratePreview}
                                    disabled={!targetSelection || !entryFunction}
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate Template Preview
                                </Button>
                            ))}
                    </div>

                    {/* Preview */}
                    <div ref={previewRef} className="flex flex-col gap-6">
                        {preview ? (
                            <TemplatePreview preview={preview} />
                        ) : (
                            <Card className="flex-1 min-h-[400px] flex items-center">
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
                        <Button
                            className="w-full"
                            onClick={handleSaveButtonClick}
                            disabled={
                                isEditMode
                                    ? updateQuestionTemplate.isPending
                                    : createAssessmentTemplate.isPending ||
                                      addQuestionTemplate.isPending ||
                                      createQuestionTemplateBank.isPending ||
                                      insertQuestionTemplateIntoBank.isPending
                            }
                        >
                            {(isEditMode && updateQuestionTemplate.isPending) ||
                            createAssessmentTemplate.isPending ||
                            addQuestionTemplate.isPending ||
                            createQuestionTemplateBank.isPending ||
                            insertQuestionTemplateIntoBank.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditMode ? "Update Template" : "Save Template"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Save Modal */}
                {showSaveModal && !isEditMode && (
                    <SaveTemplateModal
                        open={showSaveModal}
                        onOpenChange={setShowSaveModal}
                        ownerId={user?.id || ""}
                        currentFolderId={currentFolderId || ""}
                        onSaveToNewAssessmentTemplate={handleSaveToNewAssessmentTemplate}
                        onSaveToExistingAssessmentTemplate={handleSaveToExistingAssessmentTemplate}
                        onSaveToNewQuestionTemplateBank={handleSaveToNewQuestionTemplateBank}
                        onSaveToExistingQuestionTemplateBank={
                            handleSaveToExistingQuestionTemplateBank
                        }
                        isLoadingAssessmentTemplate={
                            createAssessmentTemplate.isPending || addQuestionTemplate.isPending
                        }
                        isLoadingQuestionTemplateBank={
                            createQuestionTemplateBank.isPending ||
                            insertQuestionTemplateIntoBank.isPending
                        }
                        preSelectedAssessmentTemplateId={
                            destinationAssessmentTemplateId || undefined
                        }
                        preSelectedQuestionTemplateBankId={destinationTemplateBankId || undefined}
                        initialView={
                            destinationAssessmentTemplateId
                                ? "assessment-template"
                                : destinationTemplateBankId
                                  ? "question-template-bank"
                                  : "destination"
                        }
                    />
                )}
            </div>
        </Form>
    );
}

export default TemplateBuilderPage;
