import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder as FolderIcon, FileText, LayoutTemplate, MoreVertical } from "lucide-react";

type ResourceType = "folder" | "assessment" | "assessment_template";

interface Resource {
    id: string;
    resourceType: ResourceType;
    name?: string;
    title?: string;
    description?: string | null;
}

interface ResourceCardProps {
    resource: Resource;
    onClick: () => void;
    onRename: () => void;
    onMove: () => void;
    onDelete: () => void;
}

export function ResourceCard({ resource, onClick, onRename, onMove, onDelete }: ResourceCardProps) {
    const getIcon = () => {
        switch (resource.resourceType) {
            case "folder":
                return <FolderIcon className="h-5 w-5 text-blue-500" />;
            case "assessment":
                return <FileText className="h-5 w-5 text-green-500" />;
            case "assessment_template":
                return <LayoutTemplate className="h-5 w-5 text-purple-500" />;
        }
    };

    const getName = () => {
        return resource.resourceType === "folder" ? resource.name : resource.title;
    };

    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {getIcon()}
                        <CardTitle className="text-base">{getName()}</CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename();
                                }}
                            >
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove();
                                }}
                            >
                                Move
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            {resource.description && (
                <CardContent>
                    <CardDescription className="line-clamp-2">
                        {resource.description}
                    </CardDescription>
                </CardContent>
            )}
        </Card>
    );
}
