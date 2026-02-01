import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Play } from "lucide-react";
import type { QuestionTemplateResponse } from "@/api/models";

interface QuestionTemplateActionsMenuProps {
    template: QuestionTemplateResponse;
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
}

export function QuestionTemplateActionsMenu({
    template,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
}: QuestionTemplateActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-accent">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCreateQuestion(template)}>
                    <Play className="h-4 w-4 mr-2" />
                    Create Question
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(template)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(template)}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onRemove(template)}>
                    Remove
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
