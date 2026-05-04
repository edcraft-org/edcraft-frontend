// Code analysis hook

import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { analyseCode } from "../services/code-analysis.service";
import { isAbortError } from "@/api/pollJob";
import type { CodeAnalysisRequest } from "@/api/models";

// Hook to analyze code and generate code information and form schema
export function useAnalyseCode() {
    const controllerRef = useRef<AbortController | null>(null);

    const mutation = useMutation({
        mutationFn: (data: CodeAnalysisRequest) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return analyseCode(data, controller.signal);
        },
        onError: (error) => {
            if (isAbortError(error)) return;
        },
    });

    const cancel = useCallback(() => controllerRef.current?.abort(), []);

    return { ...mutation, cancel };
}
