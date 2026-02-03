import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question } from "@/api/models";
import { QuestionContent } from "@/components/QuestionContent";

interface QuestionDisplayProps {
    question: Question;
    questionType: string;
}

export function QuestionDisplay({ question, questionType }: QuestionDisplayProps) {
    const { text, answer, options, correct_indices } = question;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Generated Question</CardTitle>
            </CardHeader>
            <CardContent>
                <QuestionContent
                    questionText={text}
                    questionType={questionType}
                    options={options ?? undefined}
                    correctIndices={correct_indices ?? undefined}
                    answer={answer}
                />
            </CardContent>
        </Card>
    );
}
