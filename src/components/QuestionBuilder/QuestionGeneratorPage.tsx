// QuestionGeneratorPage - Generate questions from code with two-column layout

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Code2, Wand2, Save, Search } from "lucide-react";
import { useCodeAnalysis } from "../../hooks/useCodeAnalysis";
import { TargetSelector } from "./TargetSelector";
import { QuestionDisplay } from "./QuestionDisplay";
import { SaveQuestionModal } from "@/features/questions/components";
import { useUserStore } from "@/shared/stores/user.store";
import { useAddQuestionToAssessment, useCreateAssessment } from "@/features/assessments/hooks/useAssessments";
import { flattenTarget } from "../../utils/transformTarget";
import type { TargetSelection, OutputType, QuestionType } from '@/types/frontend.types';

interface QuestionGeneratorPageProps {
  destinationAssessmentId?: string;
}

export function QuestionGeneratorPage({ destinationAssessmentId }: QuestionGeneratorPageProps) {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const rootFolderId = useUserStore((state) => state.rootFolderId);

  // Code analysis state
  const {
    formSchema,
    submittedCode,
    isAnalysing,
    analyseError,
    isGenerating,
    generateError,
    generatedQuestion,
    questionType: generatedQuestionType,
    analyseCode,
    generateQuestion,
    reset,
  } = useCodeAnalysis();

  // Form state
  const [code, setCode] = useState("");
  const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);
  const [entryFunction, setEntryFunction] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("first");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [numDistractors, setNumDistractors] = useState(4);
  const [inputDataJson, setInputDataJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Mutations
  const addQuestion = useAddQuestionToAssessment();
  const createAssessment = useCreateAssessment();

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
    analyseCode(code);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Reset analysis when code changes
    if (formSchema) {
      reset();
      setTargetSelection(null);
      setEntryFunction("");
    }
  };

  const handleGenerateQuestion = () => {
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

    // Parse input data JSON
    let inputData: Record<string, unknown> = {};
    if (inputDataJson.trim()) {
      try {
        inputData = JSON.parse(inputDataJson);
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON format");
        toast.error("Invalid JSON format in input data");
        return;
      }
    }

    const request = {
      code: submittedCode,
      question_spec: {
        target: flattenTarget(targetSelection),
        output_type: outputType,
        question_type: questionType,
      },
      execution_spec: {
        entry_function: entryFunction,
        input_data: inputData,
      },
      generation_options: {
        num_distractors: numDistractors,
      },
    };

    generateQuestion(request);
  };

  const handleSaveToNewAssessment = (title: string, description: string | undefined, folderId: string) => {
    if (!generatedQuestion || !user) return;

    // First create the assessment
    createAssessment.mutate(
      {
        owner_id: user.id,
        folder_id: folderId,
        title,
        description,
      },
      {
        onSuccess: (newAssessment) => {
          // Now add the question to the new assessment
          addQuestion.mutate(
            {
              assessmentId: newAssessment.id,
              data: {
                question: {
                  owner_id: user.id,
                  question_type: generatedQuestionType || "mcq",
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
                toast.success("Question saved to new assessment");
                setShowSaveModal(false);
                navigate(-1);
              },
              onError: (error) => {
                toast.error(`Failed to add question: ${error.message}`);
              },
            }
          );
        },
        onError: (error) => {
          toast.error(`Failed to create assessment: ${error.message}`);
        },
      }
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
            question_type: generatedQuestionType || "mcq",
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
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="input-data">Input Data (JSON)</Label>
                  <Textarea
                    id="input-data"
                    placeholder='{"arr": [5, 2, 8, 1]}'
                    className="font-mono text-sm min-h-[100px]"
                    value={inputDataJson}
                    onChange={(e) => {
                      setInputDataJson(e.target.value);
                      setJsonError(null);
                    }}
                  />
                  {jsonError && (
                    <p className="text-sm text-destructive">{jsonError}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button - Only show after configuration */}
          {formSchema && (
            <Button
              className="w-full"
              onClick={handleGenerateQuestion}
              disabled={
                isGenerating ||
                !targetSelection ||
                !entryFunction
              }
            >
              {isGenerating ? (
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

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {generatedQuestion && generatedQuestionType ? (
            <>
              <QuestionDisplay response={generatedQuestion} questionType={generatedQuestionType} />
              {generateError && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
                  <p className="text-red-600 dark:text-red-400">{generateError}</p>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => setShowSaveModal(true)}
                disabled={createAssessment.isPending || addQuestion.isPending}
              >
                {(createAssessment.isPending || addQuestion.isPending) ? (
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
        currentFolderId={rootFolderId || undefined}
        onSaveToNew={handleSaveToNewAssessment}
        onSaveToExisting={handleSaveToExistingAssessment}
        isLoading={createAssessment.isPending || addQuestion.isPending}
        preSelectedAssessmentId={destinationAssessmentId}
      />
    </div>
  );
}
