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
import { Link2, Copy } from "lucide-react";

interface LinkOrDuplicateTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLink: () => void;
    onDuplicate: () => void;
    isLoading?: boolean;
}

export function LinkOrDuplicateTemplateModal({
    open,
    onOpenChange,
    onLink,
    onDuplicate,
    isLoading,
}: LinkOrDuplicateTemplateModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-500" />
                        Link or Duplicate?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                How would you like to add this question template?
                            </p>

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
                                            Creates a linked copy. You can edit it independently,
                                            and sync from the source when needed.
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => onDuplicate()}
                                    disabled={isLoading}
                                    className="w-full flex items-start gap-3 p-3 rounded-md border text-left hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="h-5 w-5 mt-0.5 text-green-500" />
                                    <div>
                                        <div className="font-medium text-sm">Duplicate</div>
                                        <p className="text-xs text-muted-foreground">
                                            Creates an independent copy. Changes won't affect other
                                            assessment templates or template banks.
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
