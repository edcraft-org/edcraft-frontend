import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient, queryKeys } from "@/shared/services";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, MoreVertical, GripVertical } from "lucide-react";
import { ROUTES } from "@/router/paths";
import type { AssessmentWithQuestions } from "./types/assessment.types";

function AssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading } = useQuery({
    queryKey: queryKeys.assessments.detail(assessmentId || ""),
    queryFn: () => apiClient.get<AssessmentWithQuestions>(`/assessments/${assessmentId}`),
    enabled: !!assessmentId,
  });

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!assessment) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Assessment not found
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-muted-foreground mt-1">{assessment.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigate(`${ROUTES.QUESTION_BUILDER}?destination=${assessment.id}`)
              }
            >
              Generate New Question
            </DropdownMenuItem>
            <DropdownMenuItem>Create Manually</DropdownMenuItem>
            <DropdownMenuItem>Add Existing Question</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Questions List */}
      {assessment.questions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No questions yet</p>
          <p className="text-sm">Add questions using the button above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assessment.questions.map((question, index) => (
            <Card key={question.id} className="group">
              <CardHeader className="py-3">
                <div className="flex items-center gap-3">
                  <div className="cursor-grab opacity-50 group-hover:opacity-100">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base font-normal">
                      {question.question_text}
                    </CardTitle>
                  </div>
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    {question.question_type.toUpperCase()}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssessmentPage;
