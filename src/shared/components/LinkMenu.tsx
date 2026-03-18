import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, RefreshCw, ExternalLink, Unlink } from "lucide-react";
import type { QuestionResponse } from "@/types/frontend.types";

interface LinkMenuProps {
    question: QuestionResponse;
    onSync: (question: QuestionResponse) => void;
    onGoToSource: (question: QuestionResponse) => void;
    onUnlink: (question: QuestionResponse) => void;
}

export function LinkMenu({ question, onSync, onGoToSource, onUnlink }: LinkMenuProps) {
    if (!question.linked_from_question_id) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-500 hover:text-blue-600"
                >
                    <Link2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onSync(question)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync from source
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGoToSource(question)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to source
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onUnlink(question)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
