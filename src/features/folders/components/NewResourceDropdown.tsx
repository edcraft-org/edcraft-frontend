import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder as FolderIcon, FileText, LayoutTemplate, Plus } from "lucide-react";

interface NewResourceDropdownProps {
    onCreateFolder: () => void;
    onCreateAssessment: () => void;
    onCreateTemplate: () => void;
}

export function NewResourceDropdown({
    onCreateFolder,
    onCreateAssessment,
    onCreateTemplate,
}: NewResourceDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCreateFolder}>
                    <FolderIcon className="h-4 w-4 mr-2" />
                    New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateAssessment}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Assessment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateTemplate}>
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    New Assessment Template
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
