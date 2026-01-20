// CreateFromTemplateModal - Modal for generating a question from a question template

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, CheckCircle2, Code2 } from "lucide-react";
import { useGenerateFromTemplate } from "../hooks/useQuestionTemplates";
import type { QuestionTemplate } from "../types/template.types";
import type { GeneratedQuestion } from "../services/template.service";

interface CreateFromTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuestionTemplate | null;
  onQuestionGenerated?: (question: GeneratedQuestion, template: QuestionTemplate) => void;
}

export function CreateFromTemplateModal({
  open,
  onOpenChange,
  template,
  onQuestionGenerated,
}: CreateFromTemplateModalProps) {
  const [inputDataJson, setInputDataJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);

  const generateQuestion = useGenerateFromTemplate();

  const handleClose = () => {
    onOpenChange(false);
    setInputDataJson("");
    setJsonError(null);
    setGeneratedQuestion(null);
  };

  const handleGenerate = () => {
    if (!template) return;

    // Parse input data JSON
    let inputData: Record<string, unknown> = {};
    if (inputDataJson.trim()) {
      try {
        inputData = JSON.parse(inputDataJson);
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON format");
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
      }
    );
  };

  const handleSave = () => {
    if (generatedQuestion && template && onQuestionGenerated) {
      onQuestionGenerated(generatedQuestion, template);
      handleClose();
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Question from Template</DialogTitle>
          <DialogDescription>
            Provide input data to generate a specific question from this template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Template: {template.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type: {template.question_type.toUpperCase()}
              </p>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Input Data */}
          {!generatedQuestion && (
            <div className="space-y-2">
              <Label htmlFor="input-data">
                Input Data (JSON)
              </Label>
              <p className="text-sm text-muted-foreground">
                Provide the input parameters for the algorithm. Example: {`{"arr": [5, 2, 8, 1]}`}
              </p>
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
          )}

          {/* Generated Question Preview */}
          {generatedQuestion && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Generated Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{generatedQuestion.text}</p>

                {generatedQuestion.options && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Options:</p>
                    <ul className="space-y-1">
                      {generatedQuestion.options.map((option, index) => (
                        <li
                          key={index}
                          className={`text-sm p-2 rounded border ${
                            generatedQuestion.correct_indices?.includes(index)
                              ? "border-green-500 bg-white dark:bg-green-900/30"
                              : "border-border bg-white dark:bg-background"
                          }`}
                        >
                          {generatedQuestion.correct_indices?.includes(index) && (
                            <CheckCircle2 className="h-3 w-3 inline mr-2 text-green-500" />
                          )}
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedQuestion.answer && !generatedQuestion.options && (
                  <div>
                    <p className="text-xs text-muted-foreground">Answer:</p>
                    <p className="text-sm font-mono bg-white dark:bg-background p-2 rounded mt-1">
                      {generatedQuestion.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!generatedQuestion ? (
            <Button
              onClick={handleGenerate}
              disabled={generateQuestion.isPending}
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
              <Button onClick={handleSave}>
                Save Question
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
