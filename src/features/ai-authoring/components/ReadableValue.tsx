interface ReadableValueProps {
    value: unknown;
    className?: string;
    /**
     * Keep a directly rendered scalar array on one line, which reads better
     * inside table cells. Nested arrays keep their list layout.
     */
    inlineScalarArrays?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalarLabel(value: unknown): string {
    // Code authoring uses Python: keep values distinct from lookalike strings.
    if (value === undefined) return "Not provided";
    if (value === null) return "None";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "boolean") return value ? "True" : "False";
    return String(value);
}

/**
 * Renders generated values as readable text, lists and key/value pairs while
 * preserving their nested structure. Raw JSON stays available in technical
 * disclosures and the exported batch keeps the canonical value unchanged.
 */
export function ReadableValue({
    value,
    className,
    inlineScalarArrays = false,
}: ReadableValueProps) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <p className={`text-sm text-muted-foreground ${className ?? ""}`}>Empty list</p>;
        }
        if (inlineScalarArrays && value.every((item) => !Array.isArray(item) && !isRecord(item))) {
            return (
                <span className={`whitespace-pre-wrap break-words text-sm ${className ?? ""}`}>
                    [{value.map(scalarLabel).join(", ")}]
                </span>
            );
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
            {scalarLabel(value)}
        </span>
    );
}
