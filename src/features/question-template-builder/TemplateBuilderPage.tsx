// TemplateBuilderPage - Create question templates (similar to QuestionBuilder but without input data)

import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ROUTES } from "@/router/paths";
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
import { CodeInputCard, TargetSelectionCard, QuestionConfigCard } from "@/shared/components";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { SaveTemplateModal } from "./components";
import { TemplatePreview } from "./TemplatePreview";
import {
    flattenTarget,
    unflattenTarget,
} from "@/shared/components/target-selector/utils/transformTarget";
import type { CodeInfo, TemplatePreviewResponse } from "@/api/models";

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

            // Trigger code analysis
            analyseCode.mutate(
                { code: existingTemplate.code },
                {
                    onSuccess: (data) => {
                        setCodeInfo(data.code_info);

                        // Reconstruct target selection
                        try {
                            // Sort by order and convert TargetElementResponse[] to TargetElement[]
                            const sortedElements = [...existingTemplate.target_elements]
                                .sort((a, b) => a.order - b.order)
                                .map(({ order: _, element_type, id_list, ...rest }) => ({
                                    type: element_type,
                                    id: id_list,
                                    ...rest,
                                }));

                            const reconstructedTarget = unflattenTarget(sortedElements);
                            setTargetSelection(reconstructedTarget);
                        } catch (error) {
                            console.error("Failed to reconstruct target:", error);
                            toast.error("Failed to load target selection");
                        }
                    },
                    onError: (error) => {
                        toast.error(`Failed to analyze code: ${error.message}`);
                    },
                },
            );
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

    const handleSaveButtonClick = () => {
        if (!user) {
            openAuthDialog(true);
            return;
        }
        if (isEditMode) {
            // Directly update without showing modal
            handleUpdateTemplate();
        } else {
            // Show modal for new template (choose destination)
            setShowSaveModal(true);
        }
    };

    const handleSaveToNewAssessmentTemplate = (
        title: string,
        description: string | undefined,
        folderId: string,
    ) => {
        if (!preview || !user) return;

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
        if (!preview || !user) return;

        const values = form.getValues();

        // Convert preview.target_elements to CreateTargetElementRequest[]
        const targetElements = preview.target_elements.map(
            ({ element_type, id_list, ...rest }) => ({
                element_type,
                id_list,
                ...rest,
            }),
        );

        const templateData = {
            question_type: values.questionType,
            question_text: preview.question_text,
            description: values.templateDescription || undefined,
            code: preview.code,
            entry_function: preview.entry_function,
            output_type: preview.output_type,
            num_distractors: preview.num_distractors,
            target_elements: targetElements,
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
        if (!preview || !user) return;

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
        if (!preview || !user) return;

        const values = form.getValues();

        // Convert preview.target_elements to CreateTargetElementRequest[]
        const targetElements = preview.target_elements.map(
            ({ element_type, id_list, ...rest }) => ({
                element_type,
                id_list,
                ...rest,
            }),
        );

        const templateData = {
            question_type: values.questionType,
            question_text: preview.question_text,
            description: values.templateDescription || undefined,
            code: preview.code,
            entry_function: preview.entry_function,
            output_type: preview.output_type,
            num_distractors: preview.num_distractors,
            target_elements: targetElements,
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
        if (!preview || !user || !existingTemplate) return;

        const values = form.getValues();

        // Convert preview.target_elements to CreateTargetElementRequest[]
        const targetElements = preview.target_elements.map(
            ({ element_type, id_list, ...rest }) => ({
                element_type,
                id_list,
                ...rest,
            }),
        );

        updateQuestionTemplate.mutate(
            {
                templateId: existingTemplate.id,
                data: {
                    question_type: values.questionType,
                    question_text: preview.question_text,
                    description: values.templateDescription || undefined,
                    code: preview.code,
                    entry_function: preview.entry_function,
                    output_type: preview.output_type,
                    num_distractors: preview.num_distractors,
                    target_elements: targetElements,
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
                            </>
                        ) : (
                            <Card className="h-full min-h-[400px] flex items-center">
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
