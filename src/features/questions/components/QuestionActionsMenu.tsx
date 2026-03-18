import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import type { QuestionResponse } from "@/types/frontend.types";

interface QuestionActionsMenuProps {
    question: QuestionResponse;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
    onAddToCanvas: (question: QuestionResponse) => void;
    canEdit: boolean;
}

export function QuestionActionsMenu({
    question,
    onEdit,
    onDuplicate,
    onRemove,
    onAddToCanvas,
    canEdit = true,
}: QuestionActionsMenuProps) {
    const handleCopyId = () => {
        navigator.clipboard.writeText(question.id);
        toast.success("Question ID copied");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-accent">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyId}>
                    Copy Question ID
                </DropdownMenuItem>
                {canEdit && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(question)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(question)}>
                            Duplicate
                        </DropdownMenuItem>
                    </>
                )}
                {onAddToCanvas && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAddToCanvas(question)}>
                            Add to Canvas
                        </DropdownMenuItem>
                    </>
                )}
                {canEdit && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onRemove(question)}
                        >
                            Remove
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
