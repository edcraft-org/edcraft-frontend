// Question Template Builder hooks

import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import { isAbortError } from "@/api/pollJob";
import {
    generateTemplate,
    generateQuestionFromTemplate,
    generateAssessmentFromTemplate,
} from "./question-template-builder.service";
import type {
    GenerateTemplateRequest,
    GenerateQuestionFromTemplateRequest,
    GenerateAssessmentFromTemplateRequest,
} from "@/api/models";

// Hook to generate a template preview (no DB persistence)
export function useGenerateTemplatePreview() {
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: (data: GenerateTemplateRequest) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return generateTemplate(data, controller.signal);
        },
        onError: (error) => { if (isAbortError(error)) return; },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}

// Hook to generate a question from a template (no DB persistence)
export function useGenerateQuestionFromTemplate() {
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateQuestionFromTemplateRequest;
        }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return generateQuestionFromTemplate(templateId, data, controller.signal);
        },
        onError: (error) => { if (isAbortError(error)) return; },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}

// Hook to generate an assessment from a template (with DB persistence)
export function useGenerateAssessmentFromTemplate() {
    const queryClient = useQueryClient();
    const controllerRef = useRef<AbortController | null>(null);
    const mutation = useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: GenerateAssessmentFromTemplateRequest;
        }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            return generateAssessmentFromTemplate(templateId, data, controller.signal);
        },
        onError: (error) => { if (isAbortError(error)) return; },
        onSuccess: (createdAssessment) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.assessments.all(createdAssessment.owner_id),
            });
        },
    });
    const cancel = useCallback(() => controllerRef.current?.abort(), []);
    return { ...mutation, cancel };
}
