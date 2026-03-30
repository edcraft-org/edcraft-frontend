import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/router/paths";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TutorialCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    linkTo: string;
    linkLabel: string;
}

function TutorialCard({ icon: Icon, title, description, linkTo, linkLabel }: TutorialCardProps) {
    return (
        <Card className="flex flex-col">
            <CardContent className="flex flex-col gap-4 pt-6 flex-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button asChild variant="outline" className="w-fit">
                    <Link to={linkTo}>
                        {linkLabel}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

const TUTORIAL_CARDS: TutorialCardProps[] = [
    {
        icon: LayoutTemplate,
        title: "Using the Template Builder",
        description:
            "Learn how to create reusable question templates so you can generate new questions from the same code as many times as you need.",
        linkTo: ROUTES.TUTORIAL_TEMPLATE_BUILDER,
        linkLabel: "View Tutorial",
    },
    // {
    //     icon: FileQuestion,
    //     title: "Using the Question Builder",
    //     description:
    //         "Generate individual questions from your code in a few steps — write your code, configure the target, and produce complete questions with answers and distractors.",
    //     linkTo: ROUTES.QUESTION_BUILDER,
    //     linkLabel: "Try it",
    // },
];

export default function TutorialPage() {
    return (
        <div className="flex flex-col">
            {/* Header */}
            <section className="flex flex-col items-center text-center px-6 py-16 border-b bg-muted/30">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
                    Tutorials
                </h1>
                <p className="text-lg text-muted-foreground mt-4 max-w-xl">
                    Guides to get the most out of EdCraft's main tools.
                </p>
            </section>

            {/* Tutorial cards */}
            <section className="px-6 py-14 border-b">
                {/* <div className="mx-auto grid gap-6 sm:grid-cols-3"> */}
                <div className="max-w-sm mx-auto flex flex-col gap-6">
                    {TUTORIAL_CARDS.map((card) => (
                        <TutorialCard key={card.title} {...card} />
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="px-6 py-16 flex flex-col items-center text-center gap-4 bg-muted/30">
                <h2 className="text-2xl font-semibold">Ready to build your first assessment?</h2>
                <p className="text-muted-foreground max-w-md">
                    Sign up for free to make full use of EdCraft's functionalities.
                </p>
                <Button asChild size="lg">
                    <Link to={ROUTES.FOLDER_ROOT}>
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            </section>
        </div>
    );
}
