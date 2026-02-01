// CreateResourceModal - Generic modal for creating resources with name/title and description

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
const resourceFormSchema = z.object({
    primaryField: z.string().trim().min(1, "This field is required").max(100, "Too long"),
    description: z.string().trim().max(500, "Description too long").optional(),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

export interface CreateResourceModalConfig {
    title: string;
    description: string;
    primaryFieldLabel: string;
    primaryFieldPlaceholder: string;
    descriptionPlaceholder: string;
    submitButtonText: string;
}

interface CreateResourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (primaryValue: string, description?: string) => void;
    isLoading?: boolean;
    config: CreateResourceModalConfig;
}

export function CreateResourceModal({
    open,
    onOpenChange,
    onSubmit,
    isLoading = false,
    config,
}: CreateResourceModalProps) {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<ResourceFormData>({
        resolver: zodResolver(resourceFormSchema),
        defaultValues: {
            primaryField: "",
            description: "",
        },
    });

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const handleFormSubmit = (data: ResourceFormData) => {
        onSubmit(data.primaryField, data.description);
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
                                <Label htmlFor="primary-field">{config.primaryFieldLabel}</Label>
                                <Input
                                    id="primary-field"
                                    placeholder={config.primaryFieldPlaceholder}
                                    autoFocus
                                    {...register("primaryField")}
                                    aria-invalid={errors.primaryField ? "true" : "false"}
                                />
                                {errors.primaryField && (
                                    <p className="text-sm text-destructive">
                                        {errors.primaryField.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder={config.descriptionPlaceholder}
                                    rows={3}
                                    {...register("description")}
                                />
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
                                {config.submitButtonText}
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
