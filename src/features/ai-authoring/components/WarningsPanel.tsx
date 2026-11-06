import { AlertTriangle } from "lucide-react";

interface WarningsPanelProps {
    warnings?: string[] | null;
    className?: string;
}

/**
 * Always-visible summary of generation or review warnings. It is deliberately
 * not collapsed so duplicates and seed problems are seen before reviewing.
 */
export function WarningsPanel({ warnings, className }: WarningsPanelProps) {
    if (!warnings || warnings.length === 0) return null;

    return (
        <div
            className={`space-y-1 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20 ${className ?? ""}`}
        >
            <h2 className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                Warnings
            </h2>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {warnings.map((warning, index) => (
                    <li key={index} className="break-words">
                        {warning}
                    </li>
                ))}
            </ul>
        </div>
    );
}
