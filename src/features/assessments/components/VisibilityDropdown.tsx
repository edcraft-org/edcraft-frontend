import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, Globe, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateAssessment } from "../useAssessments";
import type { AssessmentVisibility } from "@/api/models";

interface VisibilityDropdownProps {
    assessmentId: string;
    currentVisibility: AssessmentVisibility;
    folderId: string;
}

export function VisibilityDropdown({
    assessmentId,
    currentVisibility,
    folderId,
}: VisibilityDropdownProps) {
    const [open, setOpen] = useState(false);
    const updateAssessment = useUpdateAssessment();

    const handleVisibilityChange = (newVisibility: string) => {
        if (newVisibility === currentVisibility) {
            setOpen(false);
            return;
        }

        updateAssessment.mutate(
            {
                assessmentId,
                data: { visibility: newVisibility as AssessmentVisibility },
                oldFolderId: folderId,
            },
            {
                onSuccess: () => {
                    toast.success(
                        `Assessment is now ${newVisibility === "public" ? "public" : "private"}`,
                    );
                    setOpen(false);
                },
                onError: (error) => {
                    toast.error(`Failed to update visibility: ${error.message}`);
                },
            },
        );
    };

    const isPrivate = currentVisibility === "private";
    const Icon = isPrivate ? Lock : Globe;
    const label = isPrivate ? "Private" : "Public";

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={updateAssessment.isPending}>
                    {updateAssessment.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Icon className="h-4 w-4 mr-2" />
                    )}
                    {label}
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuRadioGroup
                    value={currentVisibility}
                    onValueChange={handleVisibilityChange}
                >
                    <DropdownMenuRadioItem value="private">
                        <Lock className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                            <span>Private</span>
                            <span className="text-xs text-muted-foreground">Only you can view</span>
                        </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="public">
                        <Globe className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                            <span>Public</span>
                            <span className="text-xs text-muted-foreground">
                                Anyone with link can view
                            </span>
                        </div>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
