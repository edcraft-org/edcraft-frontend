import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { QuestionResponse } from "@/types/frontend.types";

interface QuestionActionsMenuProps {
    question: QuestionResponse;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
}

export function QuestionActionsMenu({
    question,
    onEdit,
    onDuplicate,
    onRemove,
}: QuestionActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 data-[state=open]:bg-accent"
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(question)}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(question)}>
                    Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onRemove(question)}
                >
                    Remove
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
