import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import { Wand2, ChevronLeft } from "lucide-react";

export default function GenerateQuestionFromTemplateTutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <Wand2 className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Generate Question from Template
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Use a saved question template to quickly produce new questions with different
                    inputs.
                </p>
            </section>

            {/* Tutorial content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    {/* Step 1 */}
                    <Step number={1} title="Open the question creation form">
                        <p>
                            Navigate to the question template and click <Code>Create Question</Code>
                            .
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/generate-question-from-template/create-question-button.png"
                            alt="Create question button"
                        />
                    </Step>

                    {/* Step 2 */}
                    <Step number={2} title="Add input data">
                        <p>Provide the required inputs for the question.</p>
                        <ul className="mt-2 text-foreground list-disc list-inside space-y-1">
                            <li>
                                If an input generator is configured, click <Code>Generate All</Code>{" "}
                                to generate all inputs at once, or click <Code>Generate</Code>{" "}
                                repeatedly to refine individual inputs.
                            </li>
                            <li>Otherwise, manually enter your input values.</li>
                        </ul>
                        <TutorialImage
                            src="/assets/tutorials/generate-input-button.png"
                            alt="Generate input button"
                            className="w-3/4"
                        />
                    </Step>

                    {/* Step 3 */}
                    <Step number={3} title="Generate the question">
                        <p>
                            Click <Code>Generate Question</Code> to produce the final question.
                        </p>
                    </Step>

                    {/* CTA */}
                    <div className="flex flex-wrap justify-between gap-3 pt-2">
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

function Step({
    number,
    title,
    children,
}: {
    number: number;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-5">
            <div className="flex items-start pt-0.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
                    {number}
                </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
                <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                <div className="text-foreground">{children}</div>
            </div>
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

function TutorialImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return (
        <div className={`mt-4 rounded-lg border overflow-hidden ${className ?? "w-full"}`}>
            <img src={src} alt={alt} className="w-full" />
        </div>
    );
}
