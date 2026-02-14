// DeleteConfirmationDialog
// Confirmation dialog for deleting folders, assessments, assessment templates, and question banks

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
import type { ResourceType } from "../types";

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    resourceType: ResourceType;
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
            case "question_bank":
                return "Delete Question Bank";
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
            case "question_bank":
                return `Are you sure you want to delete the question bank "${resourceName}"? This action cannot be undone.`;
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
