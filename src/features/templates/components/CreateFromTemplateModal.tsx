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
import { Loader2, Wand2, Code2 } from "lucide-react";
import { useGenerateFromTemplate } from "../hooks/useQuestionTemplates";
import type { QuestionTemplate } from "../types/template.types";
import type { GeneratedQuestion } from "../services/template.service";
import { QuestionDisplay } from "@/components/QuestionBuilder/QuestionDisplay";

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
            <QuestionDisplay
              response={generatedQuestion}
              questionType={generatedQuestion.question_type}
            />
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
