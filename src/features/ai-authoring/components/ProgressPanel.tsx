import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { formatDate } from "../format";
import type { AuthoringJob } from "../types";

function activeStateLabel(job: AuthoringJob): string {
    if (job.state === "queued") return "Waiting to start";
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
}

function JobDetails({ job }: { job: AuthoringJob }) {
    return (
        <details className="ml-auto text-xs">
            <summary className="cursor-pointer font-medium text-muted-foreground">
                Job details
            </summary>
            <div className="mt-2 space-y-1">
                <p className="break-all font-mono">{job.job_id}</p>
                <p className="text-muted-foreground">
                    {job.progress
                        ? `${job.progress.phase} · attempt ${job.progress.attempt}`
                        : "Phase not reported"}
                </p>
                <Link
                    className="block break-all font-mono text-primary underline underline-offset-2"
                    to={ROUTES.AI_AUTHORING_JOB(job.job_id)}
                >
                    {ROUTES.AI_AUTHORING_JOB(job.job_id)}
                </Link>
            </div>
        </details>
    );
}

export function ProgressPanel({ job }: { job: AuthoringJob }) {
    if (job.state === "completed" || job.state === "failed") {
        return (
            <section
                aria-label="Question progress"
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
                <p role="status" aria-live="polite" aria-atomic="true" className="font-medium">
                    {job.state === "completed" ? "Ready to review" : "Could not be created"}
                </p>
                <p className="text-xs text-muted-foreground">
                    Created {formatDate(job.created_at)}
                </p>
                <JobDetails job={job} />
            </section>
        );
    }

    return (
        <Card aria-busy="true">
            <CardHeader className="gap-1">
                <CardTitle>Question progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p role="status" aria-live="polite" aria-atomic="true" className="font-medium">
                    {activeStateLabel(job)}
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
