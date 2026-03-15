import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import {
    FileQuestion,
    LayoutTemplate,
    FolderOpen,
    Upload,
    Wand2,
    ArrowRight,
    Share2,
} from "lucide-react";

const features = [
    {
        icon: <FileQuestion className="h-6 w-6" />,
        title: "Question Builder",
        description:
            "Generate MCQ, MRQ, and short answer questions and answers from your Python code.",
    },
    {
        icon: <LayoutTemplate className="h-6 w-6" />,
        title: "Template Builder",
        description:
            "Create reusable question templates so you can produce fresh questions on demand with input generators.",
    },
    {
        icon: <FolderOpen className="h-6 w-6" />,
        title: "Resource Management",
        description: "Organise assessments, templates, and question banks in a folder tree.",
    },
    {
        icon: <Upload className="h-6 w-6" />,
        title: "Canvas LMS Export",
        description: "Export your assessments directly to Canvas quizzes.",
    },
    {
        icon: <Wand2 className="h-6 w-6" />,
        title: "Automatic Distractor Generation",
        description:
            "Let EdCraft analyse your code and automatically generate answers and distractors.",
    },
    {
        icon: <Share2 className="h-6 w-6" />,
        title: "Easy Sharing",
        description:
            "Share assessments with students or educators via a shareable link. No account required to view.",
    },
];

const steps = [
    {
        title: "Write your Python code",
        description:
            "Paste any Python code into the editor. EdCraft analyses the code structure automatically.",
    },
    {
        title: "Generate questions",
        description:
            "Configure the question. Supply or generate input. Let EdCraft generate question.",
    },
    {
        title: "Share with others",
        description:
            "Export to Canvas, download as a PDF, or share the assessment link directly with your students.",
    },
];

export default function LandingPage() {
    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="flex flex-col items-center text-center px-6 py-20 gap-6 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border rounded-full px-3 py-1">
                    <Wand2 className="h-3.5 w-3.5" />
                    Built for educators and students
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-xl">
                    Create reusable programming questions
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                    EdCraft turns your Python code into MCQ, MRQ, and short-answer questions.
                    Automatically generate new questions from templates.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg">
                        <Link to={ROUTES.FOLDER_ROOT}>
                            Get Started
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link to={ROUTES.QUESTION_BUILDER}>Try Question Builder</Link>
                    </Button>
                </div>
            </section>

            {/* Feature highlights */}
            <section className="px-6 py-16 max-w-5xl mx-auto w-full">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-semibold">
                        Everything you need to build great assessments
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        From code analysis to question generation to publishing.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f) => (
                        <Card key={f.title} className="border">
                            <CardContent className="pt-6 flex flex-col gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                    {f.icon}
                                </div>
                                <h3 className="font-semibold">{f.title}</h3>
                                <p className="text-sm text-muted-foreground">{f.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="px-6 py-16 border-t bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-semibold">How it works</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="flex-1 flex flex-col items-center text-center gap-3"
                            >
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                                    {i + 1}
                                </div>
                                <h3 className="font-semibold">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA footer */}
            <section className="px-6 py-16 border-t flex flex-col items-center text-center gap-4">
                <h2 className="text-2xl font-semibold">Ready to save hours on question writing?</h2>
                <p className="text-muted-foreground max-w-md">
                    Sign up for free and start generating questions today.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Button asChild size="lg">
                        <Link to={ROUTES.FOLDER_ROOT}>
                            Get Started
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link to={ROUTES.TUTORIAL}>View Tutorial</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
