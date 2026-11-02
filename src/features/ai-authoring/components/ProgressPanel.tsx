import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { capitalize, formatDate } from "../format";
import type { AuthoringJob } from "../types";

function stateLabel(job: AuthoringJob): string {
    if (job.state === "running" && job.progress) {
        return `Running — ${capitalize(job.progress.phase)}, attempt ${job.progress.attempt}`;
    }
    return capitalize(job.state);
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
                    <CardTitle>Job progress</CardTitle>
                    <Badge variant={stateVariant(job)}>{capitalize(job.state)}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p role="status" aria-live="polite" aria-atomic="true" className="font-medium">
                    {announcement}
                </p>
                {job.state === "queued" && (
                    <p className="text-muted-foreground">
                        The job is waiting for an authoring slot. You can leave this page and reopen
                        the job later.
                    </p>
                )}
                {job.state === "running" && !job.progress && (
                    <p className="text-muted-foreground">The authoring workflow is starting.</p>
                )}
                <dl className="grid gap-2 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Job ID</dt>
                        <dd className="break-all font-mono text-xs">{job.job_id}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                        <dd>{formatDate(job.created_at)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-muted-foreground">Resume URL</dt>
                        <dd>
                            <Link
                                className="break-all font-mono text-xs text-primary underline underline-offset-2"
                                to={ROUTES.AI_AUTHORING_JOB(job.job_id)}
                            >
                                {ROUTES.AI_AUTHORING_JOB(job.job_id)}
                            </Link>
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
