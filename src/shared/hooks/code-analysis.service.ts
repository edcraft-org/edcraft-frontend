// Code analysis service - API calls for analyzing code

import { api } from "@/api/client";
import type { CodeAnalysisRequest, CodeAnalysisResponse } from "@/api/models";

// Analyze code and generate code information and form schema
export async function analyseCode(
    data: CodeAnalysisRequest,
): Promise<CodeAnalysisResponse> {
    const response = await api.analyseCodeQuestionGenerationAnalyseCodePost(data);
    return response.data;
}
