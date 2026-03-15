import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { FileQuestion, LayoutTemplate, ArrowRight } from "lucide-react";

interface Step {
    title: string;
    description: string;
}

function StepList({ steps }: { steps: Step[] }) {
    return (
        <ol className="flex flex-col gap-6">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0 mt-0.5">
                        {i + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

const questionBuilderSteps: Step[] = [
    {
        title: "Write your Python code",
        description:
            "Open the Question Builder and write any Python code into the code editor.",
    },
    {
        title: "Click Analyse",
        description:
            "EdCraft parses your code and inspects its structure. This tells it what targets are available.",
    },
    {
        title: "Select target",
        description:
            "Choose how to get the answer to your question.",
    },
    {
        title: "Choose a question type and configure options",
        description:
            "Pick MCQ (single correct answer), MRQ (multiple correct answers), or Short Answer. Configure how many options to generate and any other settings.",
    },
    {
        title: "Add input data",
        description:
            "Enter the inputs to the entry function that will drive generation.",
    },
    {
        title: "Generate questions",
        description:
            'Click "Generate Questions". EdCraft generates a complete question, including the answers and distractors.',
    },
    {
        title: "Save to an assessment or question bank",
        description:
            "Review the generated question, then save them. You can create a new assessment, add to an existing one, or store them in a question bank.",
    },
];

const templateBuilderSteps: Step[] = [
    {
        title: "Paste your Python function",
        description:
            "Open the Template Builder and write any Python code into the code editor. This is the same code you'd use in the Question Builder.",
    },
    {
        title: "Click Analyse",
        description:
            "EdCraft parses your code and inspects its structure. This tells it what targets are available.",
    },
    {
        title: "Select target",
        description:
            "Choose how to get the answer to your question.",
    },
    {
        title: "Configure question type and settings",
        description:
            "Choose your question type (MCQ, MRQ, or Short Answer) and configure the generation options.",
    },
    {
        title: "Configure input generation",
        description:
            "Configure the input type and generation options to allow automatic input generation.",
    },
    {
        title: "Save the template",
        description:
            "Give your template a name and description, then save it. The template is stored in your folder tree and can be used to generate new questions any time.",
    },
    {
        title: "Generate questions from the template",
        description:
            "Open any saved template and click Generate.",
    },
];

export default function TutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">Tutorial</h1>
                <p className="text-lg text-muted-foreground mt-4 max-w-xl">
                    Guides to get the most out of EdCraft's main tools.
                </p>
            </section>

            {/* Question Builder tutorial */}
            <section className="px-6 py-14 border-b">
                <div className="max-w-3xl mx-auto flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                <FileQuestion className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-semibold">Using the Question Builder</h2>
                        </div>
                        <p className="text-muted-foreground">
                            The Question Builder lets you generate individual questions from code. Follow these steps to create your first question.
                        </p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <StepList steps={questionBuilderSteps} />
                        </CardContent>
                    </Card>

                    <div>
                        <Button asChild>
                            <Link to={ROUTES.QUESTION_BUILDER}>
                                Try the Question Builder
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Template Builder tutorial */}
            <section className="px-6 py-14 border-b bg-muted/20">
                <div className="max-w-3xl mx-auto flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                <LayoutTemplate className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-semibold">Using the Template Builder</h2>
                        </div>
                        <p className="text-muted-foreground">
                            The Template Builder allows you create reusable question templates. This means you can generate
                            new questions from the same template as many times as you need.
                        </p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <StepList steps={templateBuilderSteps} />
                        </CardContent>
                    </Card>

                    <div>
                        <Button asChild>
                            <Link to={ROUTES.TEMPLATE_BUILDER}>
                                Try the Template Builder
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="px-6 py-16 flex flex-col items-center text-center gap-4 bg-muted/30">
                <h2 className="text-2xl font-semibold">Ready to build your first assessment?</h2>
                <p className="text-muted-foreground max-w-md">
                    Sign up for free to make full use of EdCraft's functionalities.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Button asChild size="lg">
                        <Link to={ROUTES.FOLDER_ROOT}>
                            Get Started
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
