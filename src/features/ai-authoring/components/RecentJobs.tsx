import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { getAuthoringErrorMessage } from "../errors";
import { capitalize, formatDate } from "../format";
import { useAuthoringJobs } from "../hooks/useAiAuthoring";
import type { AuthoringJobState } from "../types";

function stateVariant(state: AuthoringJobState): "default" | "secondary" | "destructive" | "outline" {
    if (state === "completed") return "default";
    if (state === "failed") return "destructive";
    if (state === "running") return "secondary";
    return "outline";
}

export function RecentJobs() {
    const jobsQuery = useAuthoringJobs();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent authoring jobs</CardTitle>
            </CardHeader>
            <CardContent>
                {jobsQuery.isPending && (
                    <p className="text-sm text-muted-foreground">Loading your recent jobs…</p>
                )}

                {jobsQuery.isError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Recent jobs could not be loaded</AlertTitle>
                        <AlertDescription className="space-y-2">
                            <p>
                                {getAuthoringErrorMessage(
                                    jobsQuery.error,
                                    "Your recent authoring jobs could not be loaded.",
                                )}
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void jobsQuery.refetch()}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {jobsQuery.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No authoring jobs yet. Start one with the form.
                    </p>
                )}

                {jobsQuery.data && jobsQuery.data.length > 0 && (
                    <ul className="divide-y">
                        {jobsQuery.data.map((job) => (
                            <li key={job.job_id}>
                                <Link
                                    to={ROUTES.AI_AUTHORING_JOB(job.job_id)}
                                    className="flex flex-col gap-2 py-3 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {job.prompt_preview || "Untitled request"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {capitalize(job.difficulty)} ·{" "}
                                            {formatDate(job.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {job.approval && (
                                            <Badge
                                                variant={
                                                    job.approval.decision === "approved"
                                                        ? "default"
                                                        : "destructive"
                                                }
                                            >
                                                {capitalize(job.approval.decision)}
                                            </Badge>
                                        )}
                                        <Badge variant={stateVariant(job.state)}>
                                            {capitalize(job.state)}
                                        </Badge>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
