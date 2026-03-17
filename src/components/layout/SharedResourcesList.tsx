// SharedResourcesList - Flat list of resources shared with the current user

import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSharedAssessments } from "@/features/assessments/useAssessments";
import { CollaboratorRole } from "@/api/models";
import { ROUTES } from "@/router/paths";

export function SharedResourcesList() {
    const navigate = useNavigate();
    const { data: assessments, isLoading } = useSharedAssessments();

    if (isLoading) {
        return (
            <div className="space-y-1 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (!assessments || assessments.length === 0) {
        return (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                Nothing shared with you yet
            </p>
        );
    }

    return (
        <div className="space-y-0.5 p-2">
            {assessments.map((assessment) => (
                <button
                    key={assessment.id}
                    className="w-full text-left rounded-md px-2 py-2 hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => navigate(ROUTES.ASSESSMENT(assessment.id))}
                >
                    <p className="text-sm font-medium truncate flex-1">{assessment.title}</p>
                    {assessment.my_role && assessment.my_role !== CollaboratorRole.owner && (
                        <Badge
                            variant={
                                assessment.my_role === CollaboratorRole.editor
                                    ? "secondary"
                                    : "outline"
                            }
                            className="text-xs shrink-0"
                        >
                            {assessment.my_role === CollaboratorRole.editor ? "Editor" : "Viewer"}
                        </Badge>
                    )}
                </button>
            ))}
        </div>
    );
}
