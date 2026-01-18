import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient, queryKeys } from "@/shared/services";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, MoreVertical, Play, Code } from "lucide-react";
import { ROUTES } from "@/router/paths";
import type { AssessmentTemplateWithTemplates } from "./types/assessment-template.types";

function AssessmentTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const { data: assessmentTemplate, isLoading } = useQuery({
    queryKey: queryKeys.assessmentTemplates.detail(templateId || ""),
    queryFn: () =>
      apiClient.get<AssessmentTemplateWithTemplates>(`/assessment-templates/${templateId}`),
    enabled: !!templateId,
  });

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!assessmentTemplate) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Assessment template not found
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
          <h1 className="text-2xl font-semibold">{assessmentTemplate.title}</h1>
          {assessmentTemplate.description && (
            <p className="text-muted-foreground mt-1">{assessmentTemplate.description}</p>
          )}
        </div>
        <Button variant="outline">
          <Play className="h-4 w-4 mr-2" />
          Instantiate Assessment
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(ROUTES.TEMPLATE_BUILDER)}>
              Create New Template
            </DropdownMenuItem>
            <DropdownMenuItem>Add Existing Template</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Question Templates List */}
      {assessmentTemplate.question_templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No question templates yet</p>
          <p className="text-sm">Add question templates using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessmentTemplate.question_templates.map((template, index) => (
            <Card key={template.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Template {index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {template.question_type.toUpperCase()}
                      </span>
                    </div>
                    <CardTitle className="text-base">{template.question_text}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" />
                        Create Question
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <CardDescription className="mb-3">{template.description}</CardDescription>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Code className="h-3 w-3" />
                  <span>Entry: {template.template_config.entry_function}()</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssessmentTemplatePage;
