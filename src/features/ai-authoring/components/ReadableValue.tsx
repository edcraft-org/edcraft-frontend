interface ReadableValueProps {
    value: unknown;
    className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Renders generated values as readable text, lists and key/value pairs while
 * preserving their nested structure. Raw JSON stays available in technical
 * disclosures and the exported batch keeps the canonical value unchanged.
 */
export function ReadableValue({ value, className }: ReadableValueProps) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <p className={`text-sm text-muted-foreground ${className ?? ""}`}>Empty list</p>;
        }
        return (
            <ul className={`list-disc space-y-1 pl-4 text-sm ${className ?? ""}`}>
                {value.map((item, index) => (
                    <li key={index} className="pl-1">
                        <ReadableValue value={item} />
                    </li>
                ))}
            </ul>
        );
    }

    if (isRecord(value)) {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return <p className={`text-sm text-muted-foreground ${className ?? ""}`}>Empty</p>;
        }
        return (
            <dl className={`space-y-1 text-sm ${className ?? ""}`}>
                {entries.map(([key, item]) => (
                    <div key={key} className="space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                        <dd>
                            <ReadableValue value={item} />
                        </dd>
                    </div>
                ))}
            </dl>
        );
    }

    return (
        <span className={`whitespace-pre-wrap break-words text-sm ${className ?? ""}`}>
            {value === null || value === undefined ? "—" : String(value)}
        </span>
    );
}
