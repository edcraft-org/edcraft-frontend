import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { QuestionResponse } from "@/api/models";
import type { MultipleChoiceAdditionalData } from "@/types/frontend.types";
import { QuestionActionsMenu } from "./QuestionActionsMenu";
import { QuestionContent } from "@/components/QuestionContent";

interface QuestionCardProps {
    question: QuestionResponse;
    questionNumber?: number;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
}

export function QuestionCard({
    question,
    questionNumber,
    onEdit,
    onDuplicate,
    onRemove,
}: QuestionCardProps) {
    const { question_text, question_type, additional_data } = question;

    // Type guard for MCQ/MRQ
    const isMCQOrMRQ = question_type === "mcq" || question_type === "mrq";
    const hasOptions =
        isMCQOrMRQ && "options" in additional_data && Array.isArray(additional_data.options);

    const options = hasOptions
        ? (additional_data as unknown as MultipleChoiceAdditionalData).options
        : undefined;
    const correctIndices =
        hasOptions && "correct_indices" in additional_data
            ? (additional_data as unknown as MultipleChoiceAdditionalData).correct_indices
            : undefined;
    const answer = "answer" in additional_data ? additional_data.answer : undefined;

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
                <QuestionActionsMenu
                    question={question}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                />
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
