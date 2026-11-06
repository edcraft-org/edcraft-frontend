import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { warningText } from "../warnings";

interface WarningsPanelProps {
    warnings?: string[] | null;
    headingLevel?: "h2" | "h3";
    className?: string;
}

/**
 * Always-visible summary of generation or review warnings. It is deliberately
 * not collapsed so duplicates and seed problems are seen before reviewing.
 */
export function WarningsPanel({
    warnings,
    headingLevel = "h2",
    className,
}: WarningsPanelProps) {
    if (!warnings || warnings.length === 0) return null;
    const Heading = headingLevel;

    return (
        <div
            className={cn(
                "space-y-1 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20",
                className,
            )}
        >
            <Heading className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                Warnings
            </Heading>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {warnings.map((warning, index) => (
                    <li key={index} className="break-words">
                        {warningText(warning)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
