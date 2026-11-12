import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import type { AuthoringRetryPrefill, AuthoringReview } from "../types";

/** Sends a failed request back to the create page with every field prefilled. */
export function RetryRequestLink({ request }: { request: AuthoringReview["request"] }) {
    const prefill: AuthoringRetryPrefill = {
        prompt: request.prompt,
        difficulty: request.difficulty,
        num_distractors: request.num_distractors,
        model_profile: request.model_profile,
        connection_id: request.connection_id,
        model: request.model,
        judges: request.judges,
    };

    return (
        <Alert>
            <RotateCcw className="h-4 w-4" />
            <AlertTitle>Retry this request</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>Your prompt and settings will be filled in on the create page.</span>
                <Button asChild size="sm" variant="outline">
                    <Link to={ROUTES.AI_AUTHORING} state={{ authoringPrefill: prefill }}>
                        <RotateCcw className="h-4 w-4" />
                        Retry request
                    </Link>
                </Button>
            </AlertDescription>
        </Alert>
    );
}
