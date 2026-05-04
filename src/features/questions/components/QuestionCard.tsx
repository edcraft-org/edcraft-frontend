import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { QuestionResponse } from "@/types/frontend.types";
import { getOptions, getCorrectIndices, getAnswerText } from "@/shared/utils/questionUtils";
import { QuestionActionsMenu } from "./QuestionActionsMenu";
import { QuestionContent } from "@/features/questions/components/QuestionContent";
import { LinkMenu } from "@/shared/components";

interface QuestionCardProps {
    question: QuestionResponse;
    questionNumber?: number;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
    onAddToCanvas: (question: QuestionResponse) => void;
    onSync: (question: QuestionResponse) => void;
    onUnlink: (question: QuestionResponse) => void;
    onGoToSource: (question: QuestionResponse) => void;
    canEdit: boolean;
}

export function QuestionCard({
    question,
    questionNumber,
    onEdit,
    onDuplicate,
    onRemove,
    onAddToCanvas,
    onSync,
    onUnlink,
    onGoToSource,
    canEdit = true,
}: QuestionCardProps) {
    const { question_text, question_type, linked_from_question_id } = question;

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
                <div>
                    {linked_from_question_id && canEdit && (
                        <LinkMenu
                            item={question}
                            onSync={onSync}
                            onUnlink={onUnlink}
                            onGoToSource={onGoToSource}
                        />
                    )}
                    <QuestionActionsMenu
                        question={question}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                        onAddToCanvas={onAddToCanvas}
                        canEdit={canEdit}
                    />
                </div>
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
