import { formatReadableValue } from "../format";

interface ReadableValueProps {
    value: unknown;
    className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Renders generated values as readable text, lists and key/value pairs instead
 * of quoted JSON blobs. Raw JSON stays available in technical disclosures.
 */
export function ReadableValue({ value, className }: ReadableValueProps) {
    if (isRecord(value)) {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return <p className={className}>Empty</p>;
        }
        return (
            <dl className={`grid gap-2 ${className ?? ""}`}>
                {entries.map(([key, item]) => (
                    <div key={key} className="space-y-1">
                        <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                        <dd className="text-sm">
                            <ReadableValue value={item} />
                        </dd>
                    </div>
                ))}
            </dl>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <p className={className}>Empty list</p>;
        }
        return (
            <ul className={`list-disc space-y-1 pl-4 text-sm ${className ?? ""}`}>
                {value.map((item, index) => (
                    <li key={index}>
                        <ReadableValue value={item} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <p className={`whitespace-pre-wrap break-words text-sm ${className ?? ""}`}>
            {formatReadableValue(value)}
        </p>
    );
}
