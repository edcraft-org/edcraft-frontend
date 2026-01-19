// AssessmentTemplatePage - View and manage assessment template with question templates

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/shared/services/api-client";
import { queryKeys } from "@/shared/services/query-client";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, MoreVertical, Play, Code, Loader2 } from "lucide-react";
import { ROUTES } from "@/router/paths";
import { CreateFromTemplateModal } from "@/features/templates";
import { useUserStore } from "@/shared/stores/user.store";
import {
  useAddQuestionTemplateToAssessmentTemplate,
  useRemoveQuestionTemplateFromAssessmentTemplate,
} from "./hooks/useAssessmentTemplates";
import type { AssessmentTemplateWithTemplates } from "./types/assessment-template.types";
import type { QuestionTemplate } from "@/features/templates/types/template.types";
import type { GeneratedQuestion } from "@/features/templates/services/template.service";

function AssessmentTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  // Modal states
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
  const [showInstantiateDialog, setShowInstantiateDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
  const [templateToRemove, setTemplateToRemove] = useState<QuestionTemplate | null>(null);

  const { data: assessmentTemplate, isLoading } = useQuery({
    queryKey: queryKeys.assessmentTemplates.detail(templateId || ""),
    queryFn: () =>
      apiClient.get<AssessmentTemplateWithTemplates>(`/assessment-templates/${templateId}`),
    enabled: !!templateId,
  });

  // Mutations
  const addQuestionTemplate = useAddQuestionTemplateToAssessmentTemplate();
  const removeQuestionTemplate = useRemoveQuestionTemplateFromAssessmentTemplate();

  const handleCreateQuestion = (template: QuestionTemplate) => {
    setSelectedTemplate(template);
    setShowCreateFromTemplate(true);
  };

  const handleQuestionGenerated = (_question: GeneratedQuestion, template: QuestionTemplate) => {
    // For now, just show the generated question info
    // In a full implementation, we'd prompt the user to select an assessment to save to
    toast.success(
      `Question generated from template "${template.question_text}"`,
      {
        description: "You can now save this question to an assessment.",
      }
    );
    // TODO: Open a modal to let user select which assessment to add the question to
  };

  const handleInstantiate = () => {
    // TODO: Implement assessment instantiation wizard
    toast.info("Assessment instantiation will be available soon");
    setShowInstantiateDialog(false);
  };

  // Handle duplicating a question template
  const handleDuplicateTemplate = (template: QuestionTemplate) => {
    if (!templateId || !user) return;

    addQuestionTemplate.mutate(
      {
        templateId,
        ownerId: user.id,
        data: {
          question_template: {
            owner_id: user.id,
            question_type: template.question_type,
            question_text: template.question_text,
            description: template.description,
            template_config: template.template_config,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Question template duplicated successfully");
        },
        onError: (error) => {
          toast.error(`Failed to duplicate template: ${error.message}`);
        },
      }
    );
  };

  // Handle removing a question template from assessment template
  const handleRemoveTemplate = () => {
    if (!templateId || !templateToRemove) return;

    removeQuestionTemplate.mutate(
      {
        assessmentTemplateId: templateId,
        questionTemplateId: templateToRemove.id,
      },
      {
        onSuccess: () => {
          toast.success("Question template removed from assessment template");
          setShowRemoveDialog(false);
          setTemplateToRemove(null);
        },
        onError: (error) => {
          toast.error(`Failed to remove template: ${error.message}`);
        },
      }
    );
  };

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
        <Button variant="outline" onClick={() => setShowInstantiateDialog(true)}>
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
                      <DropdownMenuItem onClick={() => handleCreateQuestion(template)}>
                        <Play className="h-4 w-4 mr-2" />
                        Create Question
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(ROUTES.TEMPLATE_EDIT(template.id))}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setTemplateToRemove(template);
                          setShowRemoveDialog(true);
                        }}
                      >
                        Remove
                      </DropdownMenuItem>
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

      {/* Create From Template Modal */}
      <CreateFromTemplateModal
        open={showCreateFromTemplate}
        onOpenChange={setShowCreateFromTemplate}
        template={selectedTemplate}
        onQuestionGenerated={handleQuestionGenerated}
      />

      {/* Instantiate Assessment Dialog */}
      <AlertDialog open={showInstantiateDialog} onOpenChange={setShowInstantiateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instantiate Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new assessment with questions generated from each template.
              You'll need to provide input data for each template to generate the questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInstantiate}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Template Confirmation */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Question Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the question template from this assessment template. The template itself
              will not be deleted and can still be used elsewhere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeQuestionTemplate.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTemplate}
              disabled={removeQuestionTemplate.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeQuestionTemplate.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AssessmentTemplatePage;
