// Code analysis service - API calls for analyzing code

import { api } from "@/api/client";
import { pollJob } from "@/api/pollJob";
import type { CodeAnalysisRequest, CodeAnalysisResponse } from "@/api/models";

// Analyze code and generate code information and form schema
export async function analyseCode(
    data: CodeAnalysisRequest,
    signal?: AbortSignal,
): Promise<CodeAnalysisResponse> {
    const response = await api.analyseCodeQuestionGenerationAnalyseCodePost(data);
    return pollJob<CodeAnalysisResponse>(response.data.job_id, { signal });
}
