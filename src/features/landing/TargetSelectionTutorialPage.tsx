import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import { Crosshair, ChevronLeft } from "lucide-react";

export default function TargetSelectionTutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <Crosshair className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Target Selection
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Learn how to use target selection to extract relevant information from your code
                    and define how answers are derived.
                </p>
            </section>

            {/* Content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-10">
                    {/* Intro */}
                    <div className="flex flex-col gap-3">
                        <p className="text-foreground">
                            Target selection helps define <strong>how answers are derived</strong>{" "}
                            from your program. By combining your code with target selection, you can
                            generate answers from your code.
                        </p>
                        <p className="text-foreground">
                            The code analyser identifies the following components in your code:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-foreground">
                            <li>
                                <strong>Functions</strong>
                            </li>
                            <li>
                                <strong>Loops</strong>
                            </li>
                            <li>
                                <strong>Branches</strong>
                            </li>
                            <li>
                                <strong>Variables</strong>
                            </li>
                        </ul>
                        <p className="text-foreground">
                            After choosing a component type, you can explore and refine selections
                            within that category.
                        </p>
                    </div>

                    <hr />

                    {/* Function Selection */}
                    <Section title="Function Selection">
                        <p className="text-foreground">
                            The <strong>function</strong> category includes both function calls and
                            method calls.
                        </p>

                        <Subsection title="Selecting Functions">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>Choose a function by its name.</li>
                                <li>
                                    You can then select specific <strong>instances</strong> of that
                                    function based on line numbers.
                                </li>
                                <li>
                                    Multiple lines can be selected to narrow down relevant calls.
                                </li>
                                <li>
                                    If you select a function <strong>definition</strong>, the system
                                    identifies all calls associated with that definition.
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="Additional Options">
                            <p className="text-foreground text-sm mb-3">
                                Once a function is selected, you can refine your target:
                            </p>
                            <div className="flex flex-col gap-3">
                                <OptionBlock title="Arguments">
                                    <p>Extract values passed into the function. You can specify:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-1">
                                        <li>
                                            Argument names (for keyword arguments or defined
                                            parameters), or
                                        </li>
                                        <li>
                                            Argument positions (e.g., <Code>0</Code>, <Code>1</Code>
                                            ).
                                        </li>
                                    </ul>
                                </OptionBlock>
                                <OptionBlock title="Return Value">
                                    <p>Retrieve the value returned by the function.</p>
                                </OptionBlock>
                                <OptionBlock title="View Elements Inside This Function">
                                    <p>
                                        Explore components within the function body. Any further
                                        selections will apply to each function call instance.
                                    </p>
                                </OptionBlock>
                            </div>
                        </Subsection>
                    </Section>

                    <hr />

                    {/* Loop Selection */}
                    <Section title="Loop Selection">
                        <p className="text-foreground">
                            The <strong>loop</strong> category includes both <Code>for</Code> and{" "}
                            <Code>while</Code> loops.
                        </p>

                        <Subsection title="Selecting Loops">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>Choose loops based on their line numbers.</li>
                                <li>
                                    By default, selection refers to the{" "}
                                    <strong>entire execution</strong> of the loop.
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="Loop Iterations">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>
                                    To analyse individual iterations, select{" "}
                                    <strong>loop iterations</strong>.
                                </li>
                                <li>This allows you to inspect each pass through the loop.</li>
                            </ul>
                        </Subsection>

                        <Subsection title="Viewing Internal Elements">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>
                                    Select <strong>View elements inside this loop</strong> to
                                    explore components within the loop.
                                </li>
                                <li>Subsequent selections will apply to:</li>
                            </ul>
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm ml-5 mt-1">
                                <li>Each full loop execution, or</li>
                                <li>Each iteration (if iteration was selected).</li>
                            </ul>
                        </Subsection>
                    </Section>

                    <hr />

                    {/* Branch Selection */}
                    <Section title="Branch Selection">
                        <p className="text-foreground">
                            The <strong>branch</strong> category includes <Code>if</Code> and{" "}
                            <Code>elif</Code> statements.
                        </p>

                        <Subsection title="Selecting Branches">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>Choose branches based on their line numbers.</li>
                            </ul>
                        </Subsection>

                        <Subsection title="Filtering Conditions">
                            <p className="text-foreground text-sm mb-1">
                                Optionally filter branches by outcome:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>
                                    Only branches that evaluate to <strong>true</strong>, or
                                </li>
                                <li>
                                    Only branches that evaluate to <strong>false</strong>.
                                </li>
                            </ul>
                        </Subsection>

                        <Subsection title="Viewing Internal Elements">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>
                                    Select <strong>View elements inside this branch</strong> to
                                    inspect its contents.
                                </li>
                                <li>
                                    Further selections will apply to every instance where the branch
                                    is executed.
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    <hr />

                    {/* Variable Selection */}
                    <Section title="Variable Selection">
                        <p className="text-foreground">
                            The <strong>variables</strong> category includes all variables within
                            the current scope.
                        </p>

                        <Subsection title="Selecting Variables">
                            <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                                <li>You can select one or multiple variables.</li>
                                <li>
                                    The output order of variables matches the order in which you
                                    selected them.
                                </li>
                            </ul>
                        </Subsection>
                    </Section>

                    {/* Back */}
                    <div className="pt-2">
                        <Button asChild variant="ghost">
                            <Link to={ROUTES.TUTORIAL}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back to Tutorials
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            {children}
        </div>
    );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 mt-2">
            <h3 className="text-base font-semibold">{title}</h3>
            <div className="text-foreground text-sm">{children}</div>
        </div>
    );
}

function OptionBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-col gap-1">
            <p className="font-medium text-sm">{title}</p>
            <div className="text-sm text-foreground">{children}</div>
        </div>
    );
}

function Code({ children }: { children: React.ReactNode }) {
    return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
            {children}
        </code>
    );
}
