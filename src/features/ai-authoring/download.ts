import type { AuthoringBatch } from "./types";

export function batchFileName(batch: AuthoringBatch): string {
    return `ai-authoring-${batch.job_id}-seed-${batch.base_seed}.json`;
}

export function downloadAuthoringBatch(batch: AuthoringBatch): void {
    const blob = new Blob([JSON.stringify(batch, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = batchFileName(batch);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
