// TemplateBuilderPage - Create question templates (similar to QuestionBuilder but without input data)

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Code2, Wand2, Save, ArrowLeft, Search } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { useGenerateTemplatePreview } from "./hooks/useQuestionTemplates";
import {
  useCreateAssessmentTemplate,
  useAddQuestionTemplateToAssessmentTemplate,
} from "@/features/assessment-templates/hooks/useAssessmentTemplates";
import { useTemplateCodeAnalysis } from "./hooks/useTemplateCodeAnalysis";
import { TemplatePreview, SaveTemplateModal } from "./components";
import { TargetSelector } from "@/components/QuestionGenerator/TargetSelector";
import { flattenTarget } from "@/utils/transformTarget";
import type { GenerateTemplatePreviewResponse } from "./services/template.service";
import type { QuestionType } from "@/features/questions/types/question.types";
import type { TargetSelection } from "@/types/api.types";

function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const isEditing = !!templateId;

  // Code analysis state
  const {
    formSchema,
    submittedCode,
    isAnalysing,
    analyseError,
    analyseCode,
    reset: resetAnalysis,
  } = useTemplateCodeAnalysis();

  // Form state
  const [code, setCode] = useState("");
  const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);
  const [entryFunction, setEntryFunction] = useState("");
  const [outputType, setOutputType] = useState<"first" | "last" | "list" | "count">("first");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [numDistractors, setNumDistractors] = useState(4);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  // Preview and save state
  const [preview, setPreview] = useState<GenerateTemplatePreviewResponse | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Mutations
  const generatePreview = useGenerateTemplatePreview();
  const createAssessmentTemplate = useCreateAssessmentTemplate();
  const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();

  // Get entry function options from analysed code
  const entryFunctionOptions = formSchema?.code_info.functions.filter((f) => f.is_definition) || [];

  const handleAnalyseCode = () => {
    if (!code.trim()) {
      toast.error("Please enter some code");
      return;
    }
    // Reset previous state
    setTargetSelection(null);
    setEntryFunction("");
    setPreview(null);
    analyseCode(code);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Reset analysis when code changes
    if (formSchema) {
      resetAnalysis();
      setTargetSelection(null);
      setEntryFunction("");
      setPreview(null);
    }
  };

  const handleGeneratePreview = () => {
    if (!submittedCode.trim()) {
      toast.error("Please analyse your code first");
      return;
    }
    if (!targetSelection) {
      toast.error("Please select a target element");
      return;
    }
    if (!entryFunction) {
      toast.error("Please select an entry function");
      return;
    }

    generatePreview.mutate(
      {
        code: submittedCode,
        entry_function: entryFunction,
        question_spec: {
          target: flattenTarget(targetSelection),
          output_type: outputType,
          question_type: questionType,
        },
        generation_options: {
          num_distractors: numDistractors,
        },
      },
      {
        onSuccess: (data) => {
          setPreview(data);
          toast.success("Template preview generated");
        },
        onError: (error) => {
          toast.error(`Failed to generate preview: ${error.message}`);
        },
      }
    );
  };

  const handleSaveToNewBank = (title: string, description?: string) => {
    if (!preview || !user) return;

    // First create the assessment template, then add the question template to it
    createAssessmentTemplate.mutate(
      {
        owner_id: user.id,
        folder_id: null,
        title,
        description,
      },
      {
        onSuccess: (newAssessmentTemplate) => {
          // Now add the question template to the new assessment template
          addQuestionTemplate.mutate(
            {
              templateId: newAssessmentTemplate.id,
              ownerId: user.id,
              data: {
                question_template: {
                  owner_id: user.id,
                  question_type: questionType,
                  question_text: templateName || preview.question_text,
                  description: templateDescription || undefined,
                  template_config: preview.template_config,
                },
              },
            },
            {
              onSuccess: () => {
                toast.success("Template saved successfully");
                setShowSaveModal(false);
                navigate(-1);
              },
              onError: (error) => {
                toast.error(`Failed to add template: ${error.message}`);
              },
            }
          );
        },
        onError: (error) => {
          toast.error(`Failed to create template bank: ${error.message}`);
        },
      }
    );
  };

  const handleSaveToExisting = (assessmentTemplateId: string) => {
    if (!preview || !user) return;

    addQuestionTemplate.mutate(
      {
        templateId: assessmentTemplateId,
        ownerId: user.id,
        data: {
          question_template: {
            owner_id: user.id,
            question_type: questionType,
            question_text: templateName || preview.question_text,
            description: templateDescription || undefined,
            template_config: preview.template_config,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Template added successfully");
          setShowSaveModal(false);
          navigate(-1);
        },
        onError: (error) => {
          toast.error(`Failed to add template: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditing ? "Edit Template" : "Template Builder"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a reusable question template from code
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Template Name & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Fibonacci Return Value"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Describe what this template generates..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Code Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Step 1: Input Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="def example(n):&#10;    return n * 2"
                className="font-mono text-sm min-h-[200px]"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isAnalysing}
              />
              {analyseError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{analyseError}</p>
                </div>
              )}
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleAnalyseCode}
                disabled={isAnalysing || !code.trim()}
              >
                {isAnalysing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analysing Code...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyse Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Target Selection - Only show after code analysis */}
          {formSchema && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 2: Select Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <TargetSelector
                    codeInfo={formSchema.code_info}
                    onTargetChange={setTargetSelection}
                  />
                </div>
                {targetSelection && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
                    Target selected: {targetSelection.type}
                    {targetSelection.name && ` - ${targetSelection.name}`}
                    {targetSelection.modifier && ` (${targetSelection.modifier})`}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Question Configuration - Only show after target selection */}
          {formSchema && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 3: Configure Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Entry Function</Label>
                  <Select value={entryFunction} onValueChange={setEntryFunction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entry function" />
                    </SelectTrigger>
                    <SelectContent>
                      {entryFunctionOptions.length === 0 ? (
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          No functions found in code
                        </div>
                      ) : (
                        entryFunctionOptions.map((func) => (
                          <SelectItem key={`${func.name}-${func.line_number}`} value={func.name}>
                            {func.name} (Line {func.line_number})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Output Type</Label>
                    <Select
                      value={outputType}
                      onValueChange={(v) => setOutputType(v as typeof outputType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">First</SelectItem>
                        <SelectItem value="last">Last</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={questionType}
                      onValueChange={(v) => setQuestionType(v as QuestionType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="mrq">Multiple Response</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(questionType === "mcq" || questionType === "mrq") && (
                  <div className="space-y-2">
                    <Label htmlFor="distractors">Number of Distractors</Label>
                    <Input
                      id="distractors"
                      type="number"
                      min={1}
                      max={10}
                      value={numDistractors}
                      onChange={(e) => setNumDistractors(Number(e.target.value))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generate Button - Only show after configuration */}
          {formSchema && (
            <Button
              className="w-full"
              onClick={handleGeneratePreview}
              disabled={
                generatePreview.isPending ||
                !targetSelection ||
                !entryFunction
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

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {preview ? (
            <>
              <TemplatePreview preview={preview} />
              <Button
                className="w-full"
                onClick={() => setShowSaveModal(true)}
                disabled={createAssessmentTemplate.isPending || addQuestionTemplate.isPending}
              >
                {(createAssessmentTemplate.isPending || addQuestionTemplate.isPending) ? (
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
        onSaveToNew={handleSaveToNewBank}
        onSaveToExisting={handleSaveToExisting}
        isLoading={createAssessmentTemplate.isPending || addQuestionTemplate.isPending}
      />
    </div>
  );
}

export default TemplateBuilderPage;
