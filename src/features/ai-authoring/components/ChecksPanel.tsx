import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import type { AuthoringCheck } from "../types";
import {
    checkDescription,
    checkLabel,
    findingText,
    statusLabel,
} from "../checkMetadata";

/** A difficulty or relevance result shown alongside the technical checks. */
export interface ChecksAdvisory {
    id: string;
    title: string;
    description: string;
    passed: boolean;
    meter?: {
        label: string;
        display: string;
        percent: number;
        caption?: string | null;
    } | null;
}

interface ChecksPanelProps {
    checks: AuthoringCheck[];
    /** Difficulty and relevance results, listed as checks but never gating approval. */
    advisories?: ChecksAdvisory[];
    /** Show a one-line summary and keep the full list behind a disclosure. */
    collapsible?: boolean;
}

function clampPercent(value: number): number {
    return Math.max(0, Math.min(100, value));
}

function AdvisoryItem({ advisory }: { advisory: ChecksAdvisory }) {
    const passed = advisory.passed;
    const meter = advisory.meter ?? null;

    return (
        <li
            data-advisory={passed ? undefined : "true"}
            className="space-y-2 rounded-md border bg-muted/30 p-3"
        >
            <div className="flex items-start gap-2">
                {passed ? (
                    <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                    />
                ) : (
                    <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
                        aria-hidden="true"
                    />
                )}
                <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">
                        <span className="sr-only">
                            {passed ? "Passed: " : "Needs attention: "}
                        </span>
                        {advisory.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{advisory.description}</p>
                </div>
            </div>
            {meter && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">{meter.label}</span>
                        <span className="font-medium">{meter.display}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                            className={
                                passed
                                    ? "h-full rounded-full bg-success"
                                    : "h-full rounded-full bg-foreground"
                            }
                            style={{ width: `${clampPercent(meter.percent)}%` }}
                        />
                    </div>
                    {meter.caption && (
                        <p className="text-xs text-muted-foreground">{meter.caption}</p>
                    )}
                </div>
            )}
        </li>
    );
}

function subsectionHeading(label: string, note: string) {
    return (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label} <span className="font-normal normal-case">· {note}</span>
        </h3>
    );
}

/**
 * Lists every check with a plain-language description of what it verifies.
 * Technical checks gate approval; difficulty and relevance only advise, so the
 * two groups are counted and shown separately.
 */
export function ChecksPanel({ checks, advisories = [], collapsible = false }: ChecksPanelProps) {
    const technical = checks.filter((check) => !check.advisory);
    const technicalFailures = technical.filter((check) => check.status !== "passed");
    const advisoryFailures = advisories.filter((advisory) => !advisory.passed);
    // The structure and answer checks both parse the template expressions, so
    // one parse failure is reported by both. Show the explanation once and let
    // later checks point back to the first one that raised it.
    const firstCheckByFinding = new Map<string, string>();

    const technicalSummary =
        technical.length === 0
            ? "No technical checks were recorded."
            : technicalFailures.length === 0
              ? `All ${technical.length} technical ${technical.length === 1 ? "check" : "checks"} passed.`
              : `${technicalFailures.length} of ${technical.length} technical ${technical.length === 1 ? "check needs" : "checks need"} attention.`;

    const advisorySummary =
        advisories.length === 0
            ? null
            : advisories.length === 1
              ? advisoryFailures.length === 0
                  ? "Advisory passed."
                  : "Advisory needs attention."
              : advisoryFailures.length === 0
                ? `All ${advisories.length} advisories passed.`
                : `${advisoryFailures.length} of ${advisories.length} advisories need attention.`;

    const summary = [technicalSummary, advisorySummary].filter(Boolean).join(" ");

    const technicalItems = (
        <ul className="space-y-3">
            {technical.map((check, index) => {
                const passed = check.status === "passed";
                const description = checkDescription(check);
                const label = checkLabel(check);
                const findings = check.findings ?? [];

                return (
                    <li key={`${check.tool}-${index}`} className="flex items-start gap-2">
                        {passed ? (
                            <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                                aria-hidden="true"
                            />
                        ) : (
                            <AlertCircle
                                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                                aria-hidden="true"
                            />
                        )}
                        <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium">
                                <span className="sr-only">{statusLabel(check.status)}: </span>
                                {label}
                            </p>
                            {description && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}
                            {!passed && check.error && (
                                <p className="text-xs text-destructive">{check.error}</p>
                            )}
                            {!passed &&
                                findings.map((finding, findingIndex) => {
                                    const text = findingText(finding);
                                    const findingKey = `${finding.code}\u0000${text}`;
                                    const firstLabel = firstCheckByFinding.get(findingKey);
                                    if (!firstLabel) {
                                        firstCheckByFinding.set(findingKey, label);
                                    }

                                    return (
                                        <p
                                            key={`${finding.code}-${findingIndex}`}
                                            className="text-xs text-muted-foreground"
                                        >
                                            {firstLabel
                                                ? `Same underlying issue as ${firstLabel}.`
                                                : text}
                                        </p>
                                    );
                                })}
                        </div>
                    </li>
                );
            })}
        </ul>
    );

    const content = (
        <div className="space-y-4">
            <section aria-label="Technical checks" className="space-y-2">
                {subsectionHeading("Technical checks", "gate approval")}
                {technical.length > 0 ? (
                    technicalItems
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No technical checks were recorded.
                    </p>
                )}
            </section>

            {advisories.length > 0 && (
                <section aria-label="Advisories" className="space-y-2">
                    {subsectionHeading("Advisories", "never block approval")}
                    <ul className="space-y-3">
                        {advisories.map((advisory) => (
                            <AdvisoryItem key={`advisory-${advisory.id}`} advisory={advisory} />
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );

    if (!collapsible) {
        return (
            <section aria-label="Checks" className="space-y-3">
                <p className="text-sm font-medium">{summary}</p>
                {content}
            </section>
        );
    }

    const technicalOk = technical.length > 0 && technicalFailures.length === 0;
    const advisoryWarning = advisoryFailures.length > 0;
    const needsAttention = !technicalOk || advisoryWarning;

    return (
        <details className="group rounded-lg border" open={needsAttention}>
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                {technicalOk ? (
                    <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${advisoryWarning ? "text-foreground" : "text-success"}`}
                        aria-hidden="true"
                    />
                ) : (
                    <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                        aria-hidden="true"
                    />
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium">Checks</h2>
                    <p className="text-xs text-muted-foreground">{summary}</p>
                </div>
                <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                />
            </summary>
            <div className="border-t p-4">{content}</div>
        </details>
    );
}
