import { api } from "@/api/client";

export const isAbortError = (e: unknown): boolean =>
    e instanceof DOMException && e.name === "AbortError";

export async function pollJob<T>(
    jobId: string,
    {
        intervalMs = 2000,
        timeoutMs = 5 * 60 * 1000,
        signal,
    }: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
        if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
        if (Date.now() >= deadline) throw new Error("Job timed out");
        const response = await api.getJobStatusJobsJobIdGet(jobId);
        const { status, result, error } = response.data;
        if (status === "completed") return result as T;
        if (status === "failed") throw new Error(error ?? "Job failed");
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, intervalMs);
            signal?.addEventListener(
                "abort",
                () => {
                    clearTimeout(timer);
                    reject(new DOMException("Cancelled", "AbortError"));
                },
                { once: true },
            );
        });
    }
}
