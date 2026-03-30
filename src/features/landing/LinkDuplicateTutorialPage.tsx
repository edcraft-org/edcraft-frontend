import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import { Copy, ChevronLeft } from "lucide-react";

export default function LinkDuplicateTutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <Copy className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Link or Duplicate Question Template
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Reuse existing question templates inside assessment templates — either by
                    linking to the original or making an independent copy.
                </p>
            </section>

            {/* Tutorial content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    {/* Step 1 */}
                    <Step number={1} title="Open an assessment template">
                        <p>Navigate to an Assessment Template (create one if needed).</p>
                    </Step>

                    {/* Step 2 */}
                    <Step number={2} title="Add a template">
                        <p>
                            Click <Code>Add Template</Code>, then select{" "}
                            <Code>Select from Template Bank</Code> (or Assessment Template).
                        </p>
                    </Step>

                    {/* Step 3 */}
                    <Step number={3} title="Copy the question template ID">
                        <p>
                            In another tab, locate the desired question template and copy its{" "}
                            <Code>Question Template ID</Code>.
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/link-duplicate-qns-template/copy-qns-id.png"
                            alt="Copy question template ID"
                        />
                    </Step>

                    {/* Step 4 */}
                    <Step number={4} title="Paste the template ID">
                        <p>
                            Paste the <Code>Question Template ID</Code> and click{" "}
                            <Code>Select</Code>.
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/link-duplicate-qns-template/paste-qns-id.png"
                            alt="Paste question template ID"
                            className="w-3/4"
                        />
                    </Step>

                    {/* Step 5 */}
                    <Step number={5} title="Choose link or duplicate">
                        <p>Select one of the following options:</p>
                        <ul className="mt-2 text-foreground list-disc list-inside space-y-1">
                            <li>
                                <strong>Link</strong> — Reference the original template.
                            </li>
                            <li>
                                <strong>Duplicate</strong> — Create an independent copy.
                            </li>
                        </ul>
                        <TutorialImage
                            src="/assets/tutorials/link-duplicate-qns-template/link-or-duplicate.png"
                            alt="Link or duplicate options"
                            className="w-3/4"
                        />
                        <p className="text-foreground mt-4">
                            Linked templates can be edited independently. Changes to the source are
                            not applied automatically. Use <Code>Sync</Code> to pull in changes from
                            the original (this overwrites your edits).
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/link-duplicate-qns-template/sync-templates.png"
                            alt="Sync templates"
                        />
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
