import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { QuestionResponse } from "@/types/frontend.types";
import { getOptions, getCorrectIndices, getAnswerText } from "@/shared/utils/questionUtils";
import { QuestionActionsMenu } from "./QuestionActionsMenu";
import { QuestionContent } from "@/components/QuestionContent";

interface QuestionCardProps {
    question: QuestionResponse;
    questionNumber?: number;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
    showActions?: boolean;
}

export function QuestionCard({
    question,
    questionNumber,
    onEdit,
    onDuplicate,
    onRemove,
    showActions = true,
}: QuestionCardProps) {
    const { question_text, question_type } = question;

    const options = getOptions(question);
    const correctIndices = getCorrectIndices(question);
    const answer = getAnswerText(question);

    return (
        <Card className="relative w-full group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center space-x-2">
                    {questionNumber !== undefined && (
                        <div className="text-sm font-medium text-muted-foreground">
                            Question {questionNumber}
                        </div>
                    )}
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                        {question_type.toUpperCase()}
                    </span>
                </div>
                {showActions && (
                    <QuestionActionsMenu
                        question={question}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                    />
                )}
            </CardHeader>
            <CardContent>
                <QuestionContent
                    questionText={question_text}
                    questionType={question_type}
                    options={options}
                    correctIndices={correctIndices}
                    answer={answer}
                />
            </CardContent>
        </Card>
    );
}
