import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "../format";
import { getJobStatus } from "../status";
import type { AuthoringJob } from "../types";

export function ProgressPanel({ job }: { job: AuthoringJob }) {
    // Completed and failed reviews show their state in the page header, so the
    // progress strip is only useful while the question is still being created.
    if (job.state === "completed" || job.state === "failed") {
        return null;
    }

    const status = getJobStatus(job);

    return (
        <Card aria-busy="true">
            <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
                <CardTitle>Question progress</CardTitle>
                <Badge variant={status.variant}>{status.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p role="status" aria-live="polite" aria-atomic="true" className="font-medium">
                    {status.summary}
                </p>
                {job.state === "queued" ? (
                    <p className="text-muted-foreground">
                        Your question is waiting for a turn. You can leave this page and reopen it
                        later.
                    </p>
                ) : (
                    !job.progress && (
                        <p className="text-muted-foreground">Question creation is starting.</p>
                    )
                )}
                <p className="text-xs text-muted-foreground">Created {formatDate(job.created_at)}</p>
            </CardContent>
        </Card>
    );
}
