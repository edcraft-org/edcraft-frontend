import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { formatDate } from "../format";
import type { AuthoringJob } from "../types";

function stateLabel(job: AuthoringJob): string {
    switch (job.state) {
        case "queued":
            return "Waiting to start";
        case "running":
            switch (job.progress?.phase) {
                case "generating":
                    return "Writing the question";
                case "checking":
                    return "Checking the question";
                case "correcting":
                    return "Improving the question";
                case "finalizing":
                    return "Finishing the question";
                default:
                    return "Creating the question";
            }
        case "completed":
            return "Ready to review";
        case "failed":
            return "Could not be created";
    }
}

function badgeLabel(job: AuthoringJob): string {
    switch (job.state) {
        case "queued":
            return "Waiting";
        case "running":
            return "Creating";
        case "completed":
            return "Ready";
        case "failed":
            return "Failed";
    }
}

function stateVariant(job: AuthoringJob): "default" | "secondary" | "destructive" | "outline" {
    if (job.state === "completed") return "default";
    if (job.state === "failed") return "destructive";
    if (job.state === "running") return "secondary";
    return "outline";
}

export function ProgressPanel({ job }: { job: AuthoringJob }) {
    const announcement = stateLabel(job);

    return (
        <Card aria-busy={job.state === "queued" || job.state === "running"}>
            <CardHeader className="gap-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Question progress</CardTitle>
                    <Badge variant={stateVariant(job)}>{badgeLabel(job)}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p role="status" aria-live="polite" aria-atomic="true" className="font-medium">
                    {announcement}
                </p>
                {job.state === "queued" && (
                    <p className="text-muted-foreground">
                        Your question is waiting for a turn. You can leave this page and reopen it
                        later.
                    </p>
                )}
                {job.state === "running" && !job.progress && (
                    <p className="text-muted-foreground">Question creation is starting.</p>
                )}
                {job.state === "completed" && (
                    <p className="text-muted-foreground">
                        Review the question, then approve it if it is ready.
                    </p>
                )}
                <p className="text-xs text-muted-foreground">Created {formatDate(job.created_at)}</p>

                <details className="rounded-md border p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-sm">Technical details</summary>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                            <dt className="font-medium text-muted-foreground">Job ID</dt>
                            <dd className="break-all font-mono">{job.job_id}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Phase</dt>
                            <dd>
                                {job.progress
                                    ? `${job.progress.phase} · attempt ${job.progress.attempt}`
                                    : "Not reported"}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="font-medium text-muted-foreground">Resume URL</dt>
                            <dd>
                                <Link
                                    className="break-all font-mono text-primary underline underline-offset-2"
                                    to={ROUTES.AI_AUTHORING_JOB(job.job_id)}
                                >
                                    {ROUTES.AI_AUTHORING_JOB(job.job_id)}
                                </Link>
                            </dd>
                        </div>
                    </dl>
                </details>
            </CardContent>
        </Card>
    );
}
