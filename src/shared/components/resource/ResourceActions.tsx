import { GripVertical, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareResourceButtonProps {
    onClick: () => void;
}

export function ShareResourceButton({ onClick }: ShareResourceButtonProps) {
    return (
        <Button variant="outline" onClick={onClick}>
            <Users className="mr-2 h-4 w-4" />
            Share
        </Button>
    );
}

interface AddResourceButtonProps {
    label: string;
    onClick: () => void;
}

export function AddResourceButton({ label, onClick }: AddResourceButtonProps) {
    return (
        <Button onClick={onClick}>
            <Plus className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}

interface ReorderActionButtonsProps {
    isReorderMode: boolean;
    isSaving?: boolean;
    onStart?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
}

export function ReorderActionButtons({
    isReorderMode,
    isSaving = false,
    onStart,
    onCancel,
    onSave,
}: ReorderActionButtonsProps) {
    if (isReorderMode) {
        return (
            <>
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={onSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Order"}
                </Button>
            </>
        );
    }

    return (
        <Button variant="outline" onClick={onStart}>
            <GripVertical className="mr-2 h-4 w-4" />
            Reorder
        </Button>
    );
}
