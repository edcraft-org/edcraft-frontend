// LinkOrDuplicateTemplateModal - Choose whether to link or duplicate a question template when adding to assessment template

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link2, Copy, AlertTriangle, Loader2 } from "lucide-react";
import { useQuestionTemplateAssessmentTemplates } from "@/features/question-templates/useQuestionTemplates";
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
    const { data: assessmentTemplates, isLoading: loadingAssessmentTemplates } =
        useQuestionTemplateAssessmentTemplates(
            open ? (template?.id ?? undefined) : undefined,
            ownerId,
        );

    const usageCount = assessmentTemplates?.length ?? 0;

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

                            {loadingAssessmentTemplates ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking usage...
                                </div>
                            ) : usageCount > 0 ? (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        This question template is currently used in{" "}
                                        <strong>
                                            {usageCount} assessment template
                                            {usageCount !== 1 ? "s" : ""}
                                        </strong>
                                        .
                                    </p>
                                </div>
                            ) : null}

                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3 p-3 rounded-md border">
                                    <Link2 className="h-5 w-5 mt-0.5 text-blue-500" />
                                    <div>
                                        <div className="font-medium text-sm">Link</div>
                                        <p className="text-xs text-muted-foreground">
                                            Changes to this question template will affect all
                                            assessment templates using it.
                                            {usageCount > 0 &&
                                                " Best for keeping templates synchronized."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-md border">
                                    <Copy className="h-5 w-5 mt-0.5 text-green-500" />
                                    <div>
                                        <div className="font-medium text-sm">Duplicate</div>
                                        <p className="text-xs text-muted-foreground">
                                            Creates an independent copy. Changes won't affect other
                                            assessment templates.
                                            {usageCount > 0 && " Best for making variations."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onDuplicate();
                        }}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Copy className="h-4 w-4 mr-2" />
                        )}
                        Duplicate
                    </AlertDialogAction>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onLink();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Link
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
