import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthorForm } from "../components/AuthorForm";
import { RecentJobs } from "../components/RecentJobs";
import { getAuthoringErrorMessage } from "../errors";
import { useAuthoringCapabilities } from "../hooks/useAiAuthoring";

export default function AiAuthoringPage() {
    const capabilitiesQuery = useAuthoringCapabilities();

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
            <header className="space-y-2">
                <h1 className="flex items-center gap-2 text-2xl font-semibold">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                    AI Authoring
                </h1>
                <p className="text-sm text-muted-foreground">
                    Ask a configured model to author a checked code question, review the evidence,
                    approve the exact artifact, then generate deterministic JSON for export.
                </p>
            </header>

            {capabilitiesQuery.isPending && (
                <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                        Loading server capabilities…
                    </CardContent>
                </Card>
            )}

            {capabilitiesQuery.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AI authoring capabilities could not be loaded</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            {getAuthoringErrorMessage(
                                capabilitiesQuery.error,
                                "The server capabilities could not be loaded.",
                            )}
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void capabilitiesQuery.refetch()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {capabilitiesQuery.data && (
                <>
                    <AuthorForm capabilities={capabilitiesQuery.data} />
                    <RecentJobs />
                </>
            )}
        </div>
    );
}
