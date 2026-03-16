import { api } from "@/api/client";

export async function pollJob<T>(
    jobId: string,
    { intervalMs = 2000, timeoutMs = 5 * 60 * 1000 } = {},
): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
        if (Date.now() >= deadline) throw new Error("Job timed out");
        const response = await api.getJobStatusJobsJobIdGet(jobId);
        const { status, result, error } = response.data;
        if (status === "completed") return result as T;
        if (status === "failed") throw new Error(error ?? "Job failed");
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}
