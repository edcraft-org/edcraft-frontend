// LinkOrDuplicateModal - Choose whether to link or duplicate a question when adding to assessment

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link2, Copy, AlertTriangle, Loader2 } from "lucide-react";
import { useQuestionUsage } from "../useQuestions";
import type { QuestionResponse } from "@/types/frontend.types";

interface LinkOrDuplicateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question: QuestionResponse | null;
    ownerId: string;
    onLink: () => void;
    onDuplicate: () => void;
    isLoading?: boolean;
}

export function LinkOrDuplicateModal({
    open,
    onOpenChange,
    question,
    ownerId,
    onLink,
    onDuplicate,
    isLoading,
}: LinkOrDuplicateModalProps) {
    const { data: usage, isLoading: loadingUsage } = useQuestionUsage(
        open ? (question?.id ?? undefined) : undefined,
        ownerId,
    );

    const assessmentCount = usage?.assessments?.length ?? 0;
    const questionBankCount = usage?.question_banks?.length ?? 0;
    const totalCount = assessmentCount + questionBankCount;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Link or Duplicate?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                How would you like to add this question to the assessment?
                            </p>

                            {loadingUsage ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking usage...
                                </div>
                            ) : totalCount > 0 ? (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        This question is currently used in{" "}
                                        {assessmentCount > 0 && (
                                            <strong>
                                                {assessmentCount} assessment{assessmentCount !== 1 ? "s" : ""}
                                            </strong>
                                        )}
                                        {assessmentCount > 0 && questionBankCount > 0 && " and "}
                                        {questionBankCount > 0 && (
                                            <strong>
                                                {questionBankCount} question bank{questionBankCount !== 1 ? "s" : ""}
                                            </strong>
                                        )}
                                        .
                                    </p>
                                </div>
                            ) : null}

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={onLink}
                                    disabled={isLoading}
                                    className="w-full flex items-start gap-3 p-3 rounded-md border text-left hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Link2 className="h-5 w-5 mt-0.5 text-blue-500" />
                                    <div>
                                        <div className="font-medium text-sm">Link</div>
                                        <p className="text-xs text-muted-foreground">
                                            Changes to this question will affect all assessments and question banks using it.
                                            {totalCount > 0 &&
                                                " Best for keeping questions synchronized."}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={onDuplicate}
                                    disabled={isLoading}
                                    className="w-full flex items-start gap-3 p-3 rounded-md border text-left hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="h-5 w-5 mt-0.5 text-green-500" />
                                    <div>
                                        <div className="font-medium text-sm">Duplicate</div>
                                        <p className="text-xs text-muted-foreground">
                                            Creates an independent copy. Changes won't affect other assessments or question banks.
                                            {totalCount > 0 && " Best for making variations."}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
