import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { pollJob, isAbortError } from "@/api/pollJob";
import type { GenerateInputsRequestInputs, GenerateInputsResponse } from "@/api/models";

export function useGenerateInputs() {
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: async (inputs: GenerateInputsRequestInputs) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            const response = await api.generateInputsInputGeneratorGeneratePost({ inputs });
            return pollJob<GenerateInputsResponse>(response.data.job_id, { signal: controller.signal });
        },
        onError: (error) => { if (isAbortError(error)) return; },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}
