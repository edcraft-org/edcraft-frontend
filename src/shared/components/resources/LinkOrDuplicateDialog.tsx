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

interface OptionConfig {
    title: string;
    description: string;
}

interface LinkOrDuplicateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLink: () => void;
    onDuplicate: () => void;
    isLoading?: boolean;

    // Customizable content
    headerText?: string;
    descriptionText?: string;

    linkOption?: OptionConfig;
    duplicateOption?: OptionConfig;
}

export function LinkOrDuplicateDialog({
    open,
    onOpenChange,
    onLink,
    onDuplicate,
    isLoading,

    headerText = "Link or Duplicate?",
    descriptionText = "How would you like to add this item?",

    linkOption = {
        title: "Link",
        description:
            "Creates a linked copy. You can edit it independently, and sync from the source.",
    },
    duplicateOption = {
        title: "Duplicate",
        description: "Creates an independent copy.",
    },
}: LinkOrDuplicateDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-500" />
                        {headerText}
                    </AlertDialogTitle>

                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{descriptionText}</p>

                            <div className="space-y-3 pt-2">
                                {/* Link */}
                                <button
                                    onClick={onLink}
                                    disabled={isLoading}
                                    className="w-full flex items-start gap-3 p-3 rounded-md border text-left hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Link2 className="h-5 w-5 mt-0.5 text-blue-500" />
                                    <div>
                                        <div className="font-medium text-sm">
                                            {linkOption.title}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {linkOption.description}
                                        </p>
                                    </div>
                                </button>

                                {/* Duplicate */}
                                <button
                                    onClick={onDuplicate}
                                    disabled={isLoading}
                                    className="w-full flex items-start gap-3 p-3 rounded-md border text-left hover:bg-accent hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="h-5 w-5 mt-0.5 text-green-500" />
                                    <div>
                                        <div className="font-medium text-sm">
                                            {duplicateOption.title}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {duplicateOption.description}
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
