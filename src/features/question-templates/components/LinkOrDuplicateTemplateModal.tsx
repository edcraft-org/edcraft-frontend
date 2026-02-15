// LinkOrDuplicateTemplateModal - Choose whether to link or duplicate a question template when adding to assessment template

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
import { useQuestionTemplateUsage } from "@/features/question-templates/useQuestionTemplates";
import type { QuestionTemplateResponse } from "@/api/models";

interface LinkOrDuplicateTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: QuestionTemplateResponse | null;
    ownerId: string;
    onLink: () => void;
    onDuplicate: () => void;
    isLoading?: boolean;
}

export function LinkOrDuplicateTemplateModal({
    open,
    onOpenChange,
    template,
    ownerId,
    onLink,
    onDuplicate,
    isLoading,
}: LinkOrDuplicateTemplateModalProps) {
    const { data: usage, isLoading: loadingUsage } = useQuestionTemplateUsage(
        open ? (template?.id ?? undefined) : undefined,
        ownerId,
    );

    const assessmentTemplateCount = usage?.assessment_templates?.length ?? 0;
    const questionTemplateBankCount = usage?.question_template_banks?.length ?? 0;
    const totalCount = assessmentTemplateCount + questionTemplateBankCount;

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
                                How would you like to add this question template to the assessment
                                template?
                            </p>

                            {loadingUsage ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking usage...
                                </div>
                            ) : totalCount > 0 ? (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        This question template is currently used in{" "}
                                        {assessmentTemplateCount > 0 && (
                                            <strong>
                                                {assessmentTemplateCount} assessment template{assessmentTemplateCount !== 1 ? "s" : ""}
                                            </strong>
                                        )}
                                        {assessmentTemplateCount > 0 && questionTemplateBankCount > 0 && " and "}
                                        {questionTemplateBankCount > 0 && (
                                            <strong>
                                                {questionTemplateBankCount} question template bank{questionTemplateBankCount !== 1 ? "s" : ""}
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
                                            Changes to this question template will affect all places using
                                            it.
                                            {totalCount > 0 &&
                                                " Best for keeping templates synchronized across all usages."}
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
                                            Creates an independent copy. Changes won't affect other usages.
                                            {totalCount > 0 &&
                                                " Best for making variations without affecting other usages."}
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
