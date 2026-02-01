// DeleteConfirmationDialog - Confirmation dialog for deleting folders, assessments, and assessment templates

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
import { Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    resourceType: "folder" | "assessment" | "assessment_template";
    resourceName: string;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    resourceType,
    resourceName,
}: DeleteConfirmationDialogProps) {
    const getTitle = () => {
        switch (resourceType) {
            case "folder":
                return "Delete Folder";
            case "assessment":
                return "Delete Assessment";
            case "assessment_template":
                return "Delete Assessment Template";
        }
    };

    const getDescription = () => {
        switch (resourceType) {
            case "folder":
                return `Are you sure you want to delete "${resourceName}"? This will also delete all contents within this folder. This action cannot be undone.`;
            case "assessment":
                return `Are you sure you want to delete the assessment "${resourceName}"? This action cannot be undone.`;
            case "assessment_template":
                return `Are you sure you want to delete the assessment template "${resourceName}"? This action cannot be undone.`;
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
                    <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
