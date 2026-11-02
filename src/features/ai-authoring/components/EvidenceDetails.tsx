import { formatValue, hasEvidence } from "../format";

interface EvidenceDetailsProps {
    summary: string;
    value: unknown;
}

export function EvidenceDetails({ summary, value }: EvidenceDetailsProps) {
    if (!hasEvidence(value)) return null;
    return (
        <details className="rounded-md border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium">{summary}</summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">
                {formatValue(value)}
            </pre>
        </details>
    );
}
