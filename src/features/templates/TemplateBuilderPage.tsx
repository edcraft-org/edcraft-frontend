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
import { Loader2, Code2, Wand2, Save, ArrowLeft } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
  useGenerateTemplatePreview,
  useCreateQuestionTemplate,
} from "./hooks/useQuestionTemplates";
import { TemplatePreview, SaveTemplateModal } from "./components";
import type { GenerateTemplatePreviewResponse } from "./services/template.service";
import type { QuestionType } from "@/features/questions/types/question.types";

function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const isEditing = !!templateId;

  // Form state
  const [code, setCode] = useState("");
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
  const createTemplate = useCreateQuestionTemplate();

  // Extract function names from code (simple regex-based extraction)
  const functionNames = code
    .match(/def\s+(\w+)\s*\(/g)
    ?.map((match) => match.replace(/def\s+/, "").replace(/\s*\(/, "")) || [];

  const handleGeneratePreview = () => {
    if (!code.trim()) {
      toast.error("Please enter some code");
      return;
    }
    if (!entryFunction) {
      toast.error("Please select an entry function");
      return;
    }

    generatePreview.mutate(
      {
        code,
        entry_function: entryFunction,
        question_spec: {
          target: [
            {
              type: "function",
              id: [0],
              name: entryFunction,
              line_number: 1,
              modifier: "return_value",
            },
          ],
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

  const handleSaveToNewBank = (_title: string, description?: string) => {
    if (!preview || !user) return;

    // For now, we'll just create the template directly
    // In a full implementation, we'd create the assessment template first, then add the question template
    createTemplate.mutate(
      {
        owner_id: user.id,
        question_type: questionType,
        question_text: templateName || preview.question_text,
        description: templateDescription || description,
        template_config: preview.template_config,
      },
      {
        onSuccess: () => {
          toast.success("Template saved successfully");
          setShowSaveModal(false);
          navigate(-1);
        },
        onError: (error) => {
          toast.error(`Failed to save template: ${error.message}`);
        },
      }
    );
  };

  const handleSaveToExisting = (_assessmentTemplateId: string) => {
    // TODO: Implement linking template to existing assessment template
    toast.info("Saving to existing template bank will be available soon");
    setShowSaveModal(false);
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
                Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="def example(n):&#10;    return n * 2"
                className="font-mono text-sm min-h-[200px]"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setPreview(null);
                }}
              />
            </CardContent>
          </Card>

          {/* Question Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entry Function</Label>
                <Select value={entryFunction} onValueChange={setEntryFunction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    {functionNames.length === 0 ? (
                      <SelectItem value="" disabled>
                        No functions found in code
                      </SelectItem>
                    ) : (
                      functionNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
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

          {/* Generate Button */}
          <Button
            className="w-full"
            onClick={handleGeneratePreview}
            disabled={generatePreview.isPending || !code.trim() || !entryFunction}
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
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {preview ? (
            <>
              <TemplatePreview preview={preview} />
              <Button
                className="w-full"
                onClick={() => setShowSaveModal(true)}
                disabled={createTemplate.isPending}
              >
                {createTemplate.isPending ? (
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
                <p>Configure your template and click "Generate Template Preview"</p>
                <p className="text-sm mt-2">
                  A sample question will be generated to show you how the template works
                </p>
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
        isLoading={createTemplate.isPending}
      />
    </div>
  );
}

export default TemplateBuilderPage;
