// AssessmentBrowser - Browse and search through existing assessments

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";
import type { AssessmentResponse } from "@/api/models";

interface AssessmentBrowserProps {
    assessments: AssessmentResponse[];
    isLoading: boolean;
    onSelectAssessment: (assessmentId: string) => void;
    disabled?: boolean;
    preSelectedAssessmentId?: string;
}

export function AssessmentBrowser({
    assessments,
    isLoading,
    onSelectAssessment,
    disabled,
    preSelectedAssessmentId,
}: AssessmentBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAssessments =
        assessments?.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    return (
        <div className="space-y-3">
            <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredAssessments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No assessments match your search"
                            : "No assessments yet. Create one above."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredAssessments.map((assessment) => (
                            <Card
                                key={assessment.id}
                                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                                    preSelectedAssessmentId === assessment.id
                                        ? "border-primary"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (!disabled) {
                                        onSelectAssessment(assessment.id);
                                    }
                                }}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {assessment.title}
                                            </p>
                                            {assessment.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {assessment.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
