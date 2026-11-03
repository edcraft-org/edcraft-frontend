import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api";
import { nextJobPollingInterval } from "../polling";
import {
    createAuthoringJob,
    decideAuthoringApproval,
    generateAuthoringBatch,
    getAuthoringCapabilities,
    getAuthoringJob,
    getAuthoringPreview,
    getAuthoringReview,
    listAuthoringJobs,
} from "../services/ai-authoring.service";
import type {
    ApprovalInput,
    CreateAuthoringJobRequest,
    GenerateInput,
} from "../types";

export function useAuthoringCapabilities() {
    return useQuery({
        queryKey: queryKeys.aiAuthoring.capabilities(),
        queryFn: getAuthoringCapabilities,
        staleTime: 60_000,
    });
}

export function useAuthoringJobs() {
    return useQuery({
        queryKey: queryKeys.aiAuthoring.jobs(),
        queryFn: listAuthoringJobs,
    });
}

export function useAuthoringJob(jobId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.aiAuthoring.job(jobId ?? ""),
        queryFn: () => getAuthoringJob(jobId ?? ""),
        enabled: Boolean(jobId),
        retry: 1,
        refetchInterval: (query) =>
            nextJobPollingInterval(query.state.data?.state, query.state.error),
        refetchIntervalInBackground: false,
    });
}

export function useAuthoringReview(jobId: string | undefined, enabled = true) {
    return useQuery({
        queryKey: queryKeys.aiAuthoring.review(jobId ?? ""),
        queryFn: () => getAuthoringReview(jobId ?? ""),
        enabled: Boolean(jobId) && enabled,
        retry: 1,
    });
}

export function useAuthoringPreview(
    jobId: string | undefined,
    artifactSha256: string | null | undefined,
    seed: number,
) {
    return useQuery({
        queryKey: queryKeys.aiAuthoring.preview(jobId ?? "", artifactSha256 ?? "", seed),
        queryFn: () => getAuthoringPreview(jobId ?? "", seed),
        enabled: Boolean(jobId && artifactSha256),
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
}

export function useCreateAuthoringJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: CreateAuthoringJobRequest) => createAuthoringJob(request),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.jobs() });
        },
    });
}

export function useDecideAuthoringApproval() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, input }: { jobId: string; input: ApprovalInput }) =>
            decideAuthoringApproval(jobId, input),
        onSuccess: (_approval, { jobId }) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.job(jobId) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.review(jobId) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.jobs() });
        },
    });
}

export function useGenerateAuthoringBatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, input }: { jobId: string; input: GenerateInput }) =>
            generateAuthoringBatch(jobId, input),
        onSuccess: (_batch, { jobId }) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.aiAuthoring.job(jobId) });
        },
    });
}
