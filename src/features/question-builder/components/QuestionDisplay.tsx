import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionType, QuestionType as QuestionTypeEnum } from "@/constants";
import type { Question } from "@/api/models";

interface QuestionDisplayProps {
    question: Question;
    questionType: QuestionType;
}

export function QuestionDisplay({ question, questionType }: QuestionDisplayProps) {
    const [showAnswer, setShowAnswer] = useState(false);

    const { text, answer, options, correct_indices } = question;

    // Convert option to string for display
    const formatOption = (option: unknown): string => {
        if (typeof option === "string") return option;
        if (typeof option === "number") return String(option);
        if (Array.isArray(option)) return JSON.stringify(option);
        if (typeof option === "object" && option !== null) return JSON.stringify(option, null, 2);
        return String(option);
    };

    // Format answer for display
    const formatAnswer = (ans: unknown): string => {
        if (typeof ans === "string") return ans;
        if (typeof ans === "number") return String(ans);
        if (Array.isArray(ans)) return JSON.stringify(ans, null, 2);
        if (typeof ans === "object" && ans !== null) return JSON.stringify(ans, null, 2);
        return String(ans);
    };

    // Get letter label for option (A, B, C, ...)
    const getOptionLabel = (index: number): string => {
        return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
    };

    // Check if an option is correct
    const isCorrectOption = (index: number): boolean => {
        return correct_indices?.includes(index) ?? false;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Generated Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Question:</h3>
                    <p className="text-foreground leading-relaxed">{text}</p>
                </div>

                {/* Options for MCQ/MRQ */}
                {(questionType === QuestionTypeEnum.MCQ || questionType === QuestionTypeEnum.MRQ) &&
                    options &&
                    options.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                Options:
                            </h3>
                            <div className="space-y-2">
                                {options.map((option, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-md border transition-colors ${
                                            showAnswer && isCorrectOption(index)
                                                ? "bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-700"
                                                : "bg-muted/50 border-border"
                                        }`}
                                    >
                                        <span className="font-semibold mr-2">
                                            {getOptionLabel(index)}.
                                        </span>
                                        <span
                                            className={
                                                showAnswer && isCorrectOption(index)
                                                    ? "text-green-700 dark:text-green-400 font-medium"
                                                    : "text-foreground"
                                            }
                                        >
                                            {formatOption(option)}
                                        </span>
                                        {showAnswer && isCorrectOption(index) && (
                                            <span className="ml-2 text-green-600 dark:text-green-400">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Show/Hide Answer Button */}
                <div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowAnswer(!showAnswer)}
                    >
                        {showAnswer ? "Hide Answer" : "Show Answer"}
                    </Button>
                </div>

                {/* Answer Section */}
                {showAnswer && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-500 dark:border-green-700 rounded-md">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                            Answer:
                        </h3>

                        {/* For MCQ/MRQ, show correct option labels */}
                        {(questionType === QuestionTypeEnum.MCQ ||
                            questionType === QuestionTypeEnum.MRQ) &&
                            correct_indices &&
                            correct_indices.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-green-700 dark:text-green-400 font-medium">
                                        Correct option{correct_indices.length > 1 ? "s" : ""}:{" "}
                                        {correct_indices
                                            .map((idx) => getOptionLabel(idx))
                                            .join(", ")}
                                    </p>
                                </div>
                            )}

                        {/* Show the actual answer value */}
                        {answer !== undefined && (
                            <div className="bg-background p-3 rounded border border-green-200 dark:border-green-800">
                                <pre className="whitespace-pre-wrap text-foreground font-mono text-sm">
                                    {formatAnswer(answer)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
