// Code analysis hook

import { useMutation } from "@tanstack/react-query";
import { analyseCode } from "./code-analysis.service";
import type { CodeAnalysisRequest } from "@/api/models";

// Hook to analyze code and generate code information and form schema
export function useAnalyseCode() {
    return useMutation({
        mutationFn: (data: CodeAnalysisRequest) => analyseCode(data),
    });
}
