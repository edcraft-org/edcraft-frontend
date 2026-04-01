import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/paths";
import { LayoutTemplate, ArrowRight, ChevronLeft } from "lucide-react";

export default function TemplateBuilderTutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                    <LayoutTemplate className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Template Builder Tutorial
                </h1>
                <p className="text-lg text-foreground mt-4 max-w-xl">
                    Question templates act as blueprints for generating questions. Follow the steps
                    below to create one.
                </p>
            </section>

            {/* Tutorial content */}
            <section className="px-6 py-14">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    {/* Step 1 */}
                    <Step number={1} title="Open the Template Builder">
                        <p>
                            Navigate to the{" "}
                            <Link
                                to={ROUTES.TEMPLATE_BUILDER}
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                Template Builder
                            </Link>{" "}
                            tab.
                        </p>
                    </Step>

                    {/* Step 2 */}
                    <Step number={2} title="Input your algorithm code">
                        <p>
                            Enter your algorithm using <strong>Python</strong> only.
                        </p>
                        <p className="text-sm text-foreground mt-1">Example:</p>
                        <pre className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">
                            <code>{`def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`}</code>
                        </pre>
                    </Step>

                    {/* Step 3 */}
                    <Step number={3} title="Analyse the code">
                        <p>
                            Click <Code>Analyse Code</Code> to examine the code structure and
                            identify its components.
                        </p>
                    </Step>

                    {/* Step 4 */}
                    <Step number={4} title="Configure the target">
                        <p>
                            The target determines how the answer will be extracted from your code.
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                            <p className="font-medium text-sm">Example scenario</p>
                            <p className="text-sm text-foreground">
                                Question: "What is the state of the array after each iteration of
                                insertion sort?"
                            </p>
                            <p className="text-sm text-foreground">
                                To obtain the answer, find the value of <Code>arr</Code> at the end
                                of each iteration of the outer for loop.
                            </p>
                            <p className="text-sm text-foreground">Configure:</p>
                            <ul className="text-sm text-foreground list-disc list-inside space-y-1 mt-1">
                                <li>
                                    Loop: <Code>for i in range(1, len(arr))</Code>
                                </li>
                                <li>
                                    Loop iterations: Enables analysis of each iteration individually
                                </li>
                                <li>
                                    View elements inside loop iterations: Applies subseqent
                                    selections within each iteration
                                </li>
                            </ul>
                        </div>
                        <TutorialImage
                            src="/assets/tutorials/template-builder/loop-iteration-selection.png"
                            alt="Loop iteration selection"
                        />
                        <p className="text-sm text-foreground mt-4">
                            Then select the variable <Code>arr</Code>.
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/template-builder/variable-selection.png"
                            alt="Variable selection"
                        />
                    </Step>

                    {/* Step 5 */}
                    <Step number={5} title="Set output type">
                        <p>
                            Select <Code>Last</Code> to capture the final value of <Code>arr</Code>{" "}
                            at the end of each loop iteration.
                        </p>
                    </Step>

                    {/* Step 6 */}
                    <Step number={6} title="Choose the entry function">
                        <p>
                            Select <Code>insertion_sort</Code> as the entry function. This is the
                            function where inputs are passed into your code.
                        </p>
                        <TutorialImage
                            src="/assets/tutorials/template-builder/question-config.png"
                            alt="Question configuration"
                        />
                    </Step>

                    {/* Step 7 */}
                    <Step number={7} title="Create a question text template (optional)">
                        <p>
                            You can define the question text using input variables. Any variable
                            name in curly braces will be replaced with the corresponding input value
                            when the question is generated. If left empty, the system will
                            automatically generate a question for you. After previewing, the
                            template will be populated. To regenerate, simply clear the text
                            template.
                        </p>
                        <p className="text-sm text-foreground mt-2">Example:</p>
                        <blockquote className="mt-2 border-l-4 pl-4 text-sm italic text-foreground">
                            What is the state of the array after each iteration of insertion sort?
                            Given the array: &#123;arr&#125;
                        </blockquote>
                    </Step>

                    {/* Step 8 */}
                    <Step number={8} title="Configure input generation">
                        <p>
                            Set up input generation to automatically generate inputs for your code.
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                            <p className="font-medium text-sm">
                                Example: Generate an integer array
                            </p>
                            <ul className="text-sm text-foreground list-disc list-inside space-y-1">
                                <li>
                                    Select <Code>Array</Code>
                                </li>
                                <li>Define minimum and maximum number of elements</li>
                                <li>
                                    Choose <Code>Integer</Code> for item schema
                                </li>
                                <li>Set minimum and maximum values for the integers</li>
                            </ul>
                        </div>
                        <TutorialImage
                            src="/assets/tutorials/template-builder/array-input-generation.png"
                            alt="Array input generation configuration"
                            className="w-4/5"
                        />
                    </Step>

                    {/* Step 9 */}
                    <Step number={9} title="Provide input values">
                        <p>
                            To generate a question preview, provide inputs to your entry function.
                        </p>
                        <ul className="mt-2 text-sm text-foreground list-disc list-inside space-y-1">
                            <li>
                                Click <Code>Generate</Code> to auto-generate inputs, or
                            </li>
                            <li>Enter custom values manually</li>
                        </ul>
                    </Step>

                    {/* Step 10 */}
                    <Step number={10} title="Preview the template">
                        <p>
                            Click <Code>Generate Template Preview</Code> to see the final output.
                        </p>
                    </Step>

                    {/* Step 11 */}
                    <Step number={11} title="Save the template">
                        <p>
                            Give your template a name and description, then save it. The template is
                            stored in your folder tree and can be used to generate new questions any
                            time.
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
                        <Button asChild>
                            <Link to={ROUTES.TEMPLATE_BUILDER}>
                                Try the Template Builder
                                <ArrowRight className="h-4 w-4 ml-2" />
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
