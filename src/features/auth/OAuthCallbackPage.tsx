import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { handleOAuthCallback } from "@/features/auth/oauth.service";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        const processCallback = async () => {
            const success = searchParams.get("success") === "true";
            const error = searchParams.get("error");
            const state = searchParams.get("state") || undefined;

            try {
                const redirectTo = await handleOAuthCallback(success, error || undefined, state);

                setStatus("success");
                toast.success("Signed in successfully");

                // Small delay to show success state before redirecting
                setTimeout(() => {
                    navigate(redirectTo, { replace: true });
                }, 500);
            } catch (err) {
                setStatus("error");
                const message = err instanceof Error ? err.message : "Authentication failed";
                setErrorMessage(message);
                toast.error(message);
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <PageSkeleton />
                <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Alert className="max-w-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>You have been signed in. Redirecting...</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Failed</AlertTitle>
                <AlertDescription className="mt-2 space-y-4">
                    <p>{errorMessage}</p>
                    <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
                        Return to Home
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}

export default OAuthCallbackPage;
