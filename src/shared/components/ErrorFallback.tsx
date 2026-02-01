import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Something went wrong
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                        An error occurred while loading this content.
                    </p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {error.message}
                    </pre>
                </CardContent>
                {resetErrorBoundary && (
                    <CardFooter>
                        <Button onClick={resetErrorBoundary} variant="outline" className="w-full">
                            Try again
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
