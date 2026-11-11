import { Badge } from "@/components/ui/badge";
import type { AuthoringQuestionPayload } from "../types";
import { CodeQuestionView } from "./CodeQuestionView";
import { EvidenceDetails } from "./EvidenceDetails";
import { GenericQuestionView } from "./GenericQuestionView";
import { buildQuestionFields, isCodeQuestionPayload } from "./questionPayload";

interface PreviewQuestionProps {
    instance: AuthoringQuestionPayload;
    /** Authoring domain from the preview or batch envelope. */
    domain?: string;
    headingLevel?: "h2" | "h3";
    /**
     * Review shows the student view and no answer revealed. Generated questions
     * also show their inputs and raw data inline.
     */
    variant?: "review" | "generated";
}

/**
 * Domain dispatcher for a generated question. The code renderer is one view;
 * unknown domains get the shared question/choice fallback.
 */
export function PreviewQuestion({
    instance,
    domain,
    headingLevel = "h2",
    variant = "generated",
}: PreviewQuestionProps) {
    const review = variant === "review";
    const Heading = headingLevel;
    const InputsHeading = headingLevel === "h2" ? "h3" : "h4";
    const fields = buildQuestionFields(instance);
    const codeInstance = isCodeQuestionPayload(instance) ? instance : null;
    // No domain means a legacy code payload; only show the code view when the
    // payload actually has the code envelope.
    const showCode = codeInstance !== null && (domain === undefined || domain === "code");

    return (
        <article className={review ? "space-y-4" : "space-y-4 rounded-lg border p-4"}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Heading className="min-w-0 text-base font-medium">{fields.text}</Heading>
                {!review && <Badge variant="default">Draft for review</Badge>}
            </div>

            {!review && (
                <p className="text-xs text-muted-foreground">
                    The correct choice is highlighted below.
                </p>
            )}

            {showCode ? (
                <CodeQuestionView
                    instance={codeInstance}
                    review={review}
                    inputsHeadingLevel={InputsHeading}
                />
            ) : (
                <GenericQuestionView payload={instance} review={review} />
            )}

            {!review && (
                <EvidenceDetails
                    summary="Raw question data"
                    value={instance}
                    variant="structured"
                />
            )}
        </article>
    );
}
