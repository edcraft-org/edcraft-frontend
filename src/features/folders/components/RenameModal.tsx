// RenameModal - Modal for renaming folders, assessments, assessment templates, and question banks

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ResourceType } from "../types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Form validation schema
const renameFormSchema = z.object({
    name: z.string().trim().min(1, "This field is required").max(100, "Too long"),
    description: z.string().trim().max(500, "Description too long").optional(),
});

type RenameFormData = z.infer<typeof renameFormSchema>;

interface RenameModalConfig {
    title: string;
    description: string;
    fieldLabel: string;
    fieldPlaceholder: string;
}

// Config definitions for each resource type
const RENAME_CONFIGS: Record<ResourceType, RenameModalConfig> = {
    folder: {
        title: "Rename Folder",
        description: "Update the name and description.",
        fieldLabel: "Name",
        fieldPlaceholder: "Enter folder name",
    },
    assessment: {
        title: "Rename Assessment",
        description: "Update the title and description.",
        fieldLabel: "Title",
        fieldPlaceholder: "Enter assessment title",
    },
    assessment_template: {
        title: "Rename Assessment Template",
        description: "Update the title and description.",
        fieldLabel: "Title",
        fieldPlaceholder: "Enter template title",
    },
    question_bank: {
        title: "Rename Question Bank",
        description: "Update the title and description.",
        fieldLabel: "Title",
        fieldPlaceholder: "Enter question bank title",
    },
};

interface RenameModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string, description?: string) => void;
    isLoading?: boolean;
    resourceType: ResourceType;
    currentName: string;
    currentDescription?: string | null;
}

export function RenameModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
    resourceType,
    currentName,
    currentDescription,
}: RenameModalProps) {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const config = RENAME_CONFIGS[resourceType];

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<RenameFormData>({
        resolver: zodResolver(renameFormSchema),
        defaultValues: {
            name: currentName,
            description: currentDescription || "",
        },
    });

    // Update form when modal opens with new values
    useEffect(() => {
        if (open) {
            reset({
                name: currentName,
                description: currentDescription || "",
            });
        }
    }, [open, currentName, currentDescription, reset]);

    const handleFormSubmit = (data: RenameFormData) => {
        onSubmit(data.name, data.description);
    };

    const handleClose = () => {
        if (isDirty && !isLoading) {
            setShowConfirmation(true);
        } else {
            onOpenChange(false);
        }
    };

    const confirmClose = () => {
        setShowConfirmation(false);
        onOpenChange(false);
    };

    const cancelClose = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(newOpen) => {
                    if (!newOpen) {
                        handleClose();
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{config.title}</DialogTitle>
                        <DialogDescription>{config.description}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(handleFormSubmit)}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="rename-name">{config.fieldLabel} *</Label>
                                <Input
                                    id="rename-name"
                                    placeholder={config.fieldPlaceholder}
                                    autoFocus
                                    {...register("name")}
                                    aria-invalid={errors.name ? "true" : "false"}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rename-description">Description (optional)</Label>
                                <Textarea
                                    id="rename-description"
                                    placeholder="Add a description..."
                                    rows={3}
                                    {...register("description")}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to close? Your changes
                            will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelClose}>
                            Continue Editing
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClose}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
