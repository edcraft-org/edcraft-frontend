// InstantiateAssessmentModal - Multi-step wizard for creating assessment from template

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, ChevronLeft, Check, Code2 } from "lucide-react";
import type { OrderedQuestionTemplate } from '@/types/frontend.types';

interface InputDataEntry {
  templateId: string;
  inputData: string;
  jsonError: string | null;
}

interface InstantiateAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentTemplateTitle: string;
  questionTemplates: OrderedQuestionTemplate[];
  onInstantiate: (
    title: string,
    description: string | undefined,
    inputDataMap: Record<string, Record<string, unknown>>
  ) => Promise<void>;
  isLoading?: boolean;
}

export function InstantiateAssessmentModal({
  open,
  onOpenChange,
  assessmentTemplateTitle,
  questionTemplates,
  onInstantiate,
  isLoading,
}: InstantiateAssessmentModalProps) {
  const totalSteps = questionTemplates.length + 1; // metadata + each template
  const [currentStep, setCurrentStep] = useState(0);

  // Assessment metadata
  const [title, setTitle] = useState(`${assessmentTemplateTitle} - Assessment`);
  const [description, setDescription] = useState("");

  // Input data for each template
  const [inputDataEntries, setInputDataEntries] = useState<InputDataEntry[]>(
    questionTemplates.map((t) => ({
      templateId: t.id,
      inputData: "",
      jsonError: null,
    }))
  );

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
    setTitle(`${assessmentTemplateTitle} - Assessment`);
    setDescription("");
    setInputDataEntries(
      questionTemplates.map((t) => ({
        templateId: t.id,
        inputData: "",
        jsonError: null,
      }))
    );
  };

  const handleInputDataChange = (index: number, value: string) => {
    setInputDataEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, inputData: value, jsonError: null } : entry
      )
    );
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 0) {
      if (!title.trim()) {
        toast.error("Please enter an assessment title");
        return false;
      }
      return true;
    }

    // Validate JSON for current template step
    const entryIndex = currentStep - 1;
    const entry = inputDataEntries[entryIndex];

    if (entry.inputData.trim()) {
      try {
        JSON.parse(entry.inputData);
        return true;
      } catch {
        setInputDataEntries((prev) =>
          prev.map((e, i) =>
            i === entryIndex ? { ...e, jsonError: "Invalid JSON format" } : e
          )
        );
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    // Build input data map
    const inputDataMap: Record<string, Record<string, unknown>> = {};
    for (const entry of inputDataEntries) {
      if (entry.inputData.trim()) {
        try {
          inputDataMap[entry.templateId] = JSON.parse(entry.inputData);
        } catch {
          // Already validated, but safety check
          toast.error("Invalid JSON in one of the templates");
          return;
        }
      } else {
        inputDataMap[entry.templateId] = {};
      }
    }

    await onInstantiate(
      title.trim(),
      description.trim() || undefined,
      inputDataMap
    );
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Instantiate Assessment</DialogTitle>
          <DialogDescription>
            Create a new assessment from this template. Step {currentStep + 1} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-2" />

        <div className="py-4">
          {/* Step 0: Assessment Metadata */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assessment Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter assessment title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Steps 1+: Input data for each template */}
          {currentStep > 0 && questionTemplates[currentStep - 1] && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Template {currentStep}: {questionTemplates[currentStep - 1].question_text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Type: {questionTemplates[currentStep - 1].question_type.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entry: {questionTemplates[currentStep - 1].template_config.entry_function}()
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor={`input-data-${currentStep}`}>
                  Input Data (JSON)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Provide the input parameters for this question template.
                </p>
                <Textarea
                  id={`input-data-${currentStep}`}
                  placeholder='{"arr": [5, 2, 8, 1]}'
                  className="font-mono text-sm min-h-[100px]"
                  value={inputDataEntries[currentStep - 1]?.inputData || ""}
                  onChange={(e) => handleInputDataChange(currentStep - 1, e.target.value)}
                />
                {inputDataEntries[currentStep - 1]?.jsonError && (
                  <p className="text-sm text-destructive">
                    {inputDataEntries[currentStep - 1].jsonError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            {isLastStep ? (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Assessment
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isLoading}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
