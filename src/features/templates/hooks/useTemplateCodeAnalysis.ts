// Hook for template code analysis - similar to useCodeAnalysis but for template creation
// Does not include question generation, only code analysis for target selection

import { useState } from "react";
import type { FormSchema } from "@/types/api.types";
import { apiService } from "@/services/api.service";

interface UseTemplateCodeAnalysisReturn {
  formSchema: FormSchema | null;
  submittedCode: string;
  isAnalysing: boolean;
  analyseError: string | null;
  analyseCode: (code: string) => Promise<void>;
  reset: () => void;
}

export function useTemplateCodeAnalysis(): UseTemplateCodeAnalysisReturn {
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string>("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState<string | null>(null);

  const analyseCode = async (code: string) => {
    setIsAnalysing(true);
    setAnalyseError(null);

    try {
      const schema = await apiService.analyseCode(code);
      setFormSchema(schema);
      setSubmittedCode(code);
    } catch (error) {
      setAnalyseError(
        error instanceof Error ? error.message : "Failed to analyse code"
      );
      setFormSchema(null);
    } finally {
      setIsAnalysing(false);
    }
  };

  const reset = () => {
    setFormSchema(null);
    setSubmittedCode("");
    setAnalyseError(null);
  };

  return {
    formSchema,
    submittedCode,
    isAnalysing,
    analyseError,
    analyseCode,
    reset,
  };
}
