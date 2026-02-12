import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { verifyEmail, resendVerification } from "@/features/auth/auth.service";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [verifiedEmail, setVerifiedEmail] = useState<string>("");
    const [resendEmail, setResendEmail] = useState<string>("");
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const processVerification = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("error");
                setErrorMessage("No verification token provided");
                return;
            }

            try {
                const response = await verifyEmail(token);
                setStatus("success");
                setVerifiedEmail(response.email);
                toast.success("Email verified successfully!");

                // Redirect to home after 3 seconds
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 3000);
            } catch (err: unknown) {
                setStatus("error");
                const message =
                    (err as { response?: { data?: { detail?: string } }; message?: string })
                        ?.response?.data?.detail ||
                    (err as { message?: string })?.message ||
                    "Email verification failed";
                setErrorMessage(message);
                toast.error(message);
            }
        };

        processVerification();
    }, [searchParams, navigate]);

    const handleResend = async () => {
        if (!resendEmail) {
            toast.error("Please enter your email address");
            return;
        }

        setIsResending(true);
        try {
            await resendVerification(resendEmail);
            toast.success("Verification email sent! Please check your inbox.");
            setResendEmail("");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { detail?: string } }; message?: string })?.response
                    ?.data?.detail ||
                (err as { message?: string })?.message ||
                "Failed to resend verification email";
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <PageSkeleton />
                <p className="mt-4 text-sm text-muted-foreground">Verifying your email...</p>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Alert className="max-w-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Email Verified!</AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">
                            Your email <strong>{verifiedEmail}</strong> has been verified
                            successfully.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You can now sign in and use all features. Redirecting to home...
                        </p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email Verification Failed</AlertTitle>
                <AlertDescription className="mt-2 space-y-4">
                    <p>{errorMessage}</p>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Need a new verification link?</p>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={resendEmail}
                                onChange={(e) => setResendEmail(e.target.value)}
                                disabled={isResending}
                            />
                            <Button
                                variant="outline"
                                onClick={handleResend}
                                disabled={isResending}
                                className="whitespace-nowrap"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                {isResending ? "Sending..." : "Resend"}
                            </Button>
                        </div>
                    </div>

                    <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
                        Return to Home
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}

export default VerifyEmailPage;
