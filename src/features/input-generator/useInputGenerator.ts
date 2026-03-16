import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { pollJob } from "@/api/pollJob";
import type { GenerateInputsRequestInputs, GenerateInputsResponse } from "@/api/models";

export function useGenerateInputs() {
    return useMutation({
        mutationFn: async (inputs: GenerateInputsRequestInputs) => {
            const response = await api.generateInputsInputGeneratorGeneratePost({ inputs });
            return pollJob<GenerateInputsResponse>(response.data.job_id);
        },
    });
}
