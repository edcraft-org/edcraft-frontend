import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import { UploadCloud, ChevronLeft } from "lucide-react";

export default function UploadToCanvasTutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <UploadCloud className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Upload to Canvas Tutorial
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Learn how to configure Canvas and upload your assessments or questions.
                </p>
            </section>

            {/* Tutorial content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    {/* Section 1 */}
                    <h2 className="text-xl font-semibold">Configure Canvas Settings</h2>

                    <Step number={1} title="Open Canvas Settings">
                        <p>
                            Click your profile icon, then select <Code>Canvas Settings</Code>.
                        </p>
                    </Step>

                    <Step number={2} title="Enter Canvas domain">
                        <p>
                            Input your Canvas domain (e.g., <Code>canvas.nus.edu.sg</Code>).
                        </p>
                    </Step>

                    <Step number={3} title="Enter access token">
                        <p>Generate and paste your access token.</p>
                        <p className="text-sm text-foreground mt-2">
                            Refer to this{" "}
                            <a
                                href="https://community.instructure.com/en/kb/articles/662901-how-do-i-manage-api-access-tokens-in-my-user-account#add-access-token"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                guide
                            </a>{" "}
                            if needed.
                        </p>
                    </Step>

                    <Step number={4} title="Save Settings">
                        <p>
                            Click <Code>Save</Code>.
                        </p>
                    </Step>

                    {/* Divider */}
                    <div className="border-t pt-6">
                        <h2 className="text-xl font-semibold">Upload Entire Assessment</h2>
                    </div>

                    <Step number={1} title="Open Upload Form">
                        <p>
                            Click on <Code>Upload to Canvas</Code>.
                        </p>
                    </Step>

                    <Step number={2} title="Select Course">
                        <p>Choose the course (only courses where you are a teacher will appear).</p>
                    </Step>

                    <Step number={3} title="Upload Assessment">
                        <p>
                            Click <Code>Upload to Canvas</Code>. Your assessment will be uploaded as
                            a new quiz.
                        </p>
                    </Step>

                    {/* Divider */}
                    <div className="border-t pt-6">
                        <h2 className="text-xl font-semibold">Upload a Single Question</h2>
                    </div>

                    <Step number={1} title="Open Upload Form">
                        <p>
                            Click the question options and select <Code>Add to Canvas</Code>.
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/upload-to-canvas/add-to-canvas-button.png"
                            alt="Add to Canvas button"
                        />
                    </Step>

                    <Step number={2} title="Select Course">
                        <p>Choose the course (only courses where you are a teacher will appear).</p>
                    </Step>

                    <Step number={3} title="Select or Create Quiz">
                        <p>Select an existing quiz, or create a new quiz.</p>
                    </Step>

                    <Step number={4} title="Upload Question">
                        <p>
                            Click <Code>Upload to Canvas</Code>.
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
