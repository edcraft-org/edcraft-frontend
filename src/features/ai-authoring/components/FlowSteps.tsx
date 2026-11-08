const STEPS = ["Create question", "Review & approve", "Create question set"] as const;

/** Shows where the reviewer is in the create → review → generate flow. */
export function FlowSteps({ current }: { current: 1 | 2 | 3 }) {
    return (
        <nav aria-label="Authoring steps" className="flex flex-wrap items-center gap-2 text-xs">
            {STEPS.map((label, index) => {
                const step = index + 1;
                const active = step === current;
                return (
                    <span key={label} className="flex items-center gap-2">
                        {index > 0 && (
                            <span aria-hidden="true" className="text-muted-foreground/60">
                                →
                            </span>
                        )}
                        <span
                            aria-current={active ? "step" : undefined}
                            className={
                                active
                                    ? "flex items-center gap-1.5 font-medium text-foreground"
                                    : "flex items-center gap-1.5 text-muted-foreground"
                            }
                        >
                            <span
                                className={
                                    active
                                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                                        : "flex h-5 w-5 items-center justify-center rounded-full border text-xs"
                                }
                            >
                                {step}
                            </span>
                            {label}
                        </span>
                    </span>
                );
            })}
        </nav>
    );
}
