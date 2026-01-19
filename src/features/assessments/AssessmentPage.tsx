// AssessmentPage - View and manage assessment questions

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ArrowLeft, Plus, MoreVertical, GripVertical, Loader2 } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import {
  useAssessment,
  useAddQuestionToAssessment,
  useLinkQuestionToAssessment,
  useRemoveQuestionFromAssessment,
} from "./hooks/useAssessments";
import {
  QuestionEditor,
  AddQuestionModal,
  LinkOrDuplicateModal,
  QuestionCard,
} from "@/features/questions";
import type { Question, OrderedQuestion } from "@/features/questions/types/question.types";

function AssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkOrDuplicateModal, setShowLinkOrDuplicateModal] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Selected question for operations
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionToEdit, setQuestionToEdit] = useState<OrderedQuestion | null>(null);
  const [questionToRemove, setQuestionToRemove] = useState<OrderedQuestion | null>(null);

  // Fetch assessment
  const { data: assessment, isLoading } = useAssessment(assessmentId ?? null);

  // Mutations
  const addQuestion = useAddQuestionToAssessment();
  const linkQuestion = useLinkQuestionToAssessment();
  const removeQuestion = useRemoveQuestionFromAssessment();

  // Handle creating a question manually
  const handleCreateManually = () => {
    setShowAddModal(false);
    setShowCreateModal(true);
  };

  // Handle selecting an existing question
  const handleSelectExisting = (question: Question) => {
    setSelectedQuestion(question);
    setShowLinkOrDuplicateModal(true);
  };

  // Handle saving a manually created question
  const handleSaveNewQuestion = (data: {
    question_type: Question["question_type"];
    question_text: string;
    additional_data: Question["additional_data"];
  }) => {
    if (!assessmentId || !user) return;

    addQuestion.mutate(
      {
        assessmentId,
        data: {
          question: {
            owner_id: user.id,
            ...data,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Question added successfully");
          setShowCreateModal(false);
        },
        onError: (error) => {
          toast.error(`Failed to add question: ${error.message}`);
        },
      }
    );
  };

  // Handle linking an existing question
  const handleLinkQuestion = () => {
    if (!assessmentId || !selectedQuestion) return;

    linkQuestion.mutate(
      {
        assessmentId,
        data: { question_id: selectedQuestion.id },
      },
      {
        onSuccess: () => {
          toast.success("Question linked successfully");
          setShowLinkOrDuplicateModal(false);
          setSelectedQuestion(null);
        },
        onError: (error) => {
          toast.error(`Failed to link question: ${error.message}`);
        },
      }
    );
  };

  // Handle duplicating a question
  const handleDuplicateQuestion = () => {
    if (!assessmentId || !selectedQuestion || !user) return;

    addQuestion.mutate(
      {
        assessmentId,
        data: {
          question: {
            owner_id: user.id,
            template_id: selectedQuestion.template_id,
            question_type: selectedQuestion.question_type,
            question_text: selectedQuestion.question_text,
            additional_data: selectedQuestion.additional_data,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Question duplicated successfully");
          setShowLinkOrDuplicateModal(false);
          setSelectedQuestion(null);
        },
        onError: (error) => {
          toast.error(`Failed to duplicate question: ${error.message}`);
        },
      }
    );
  };

  // Handle removing a question from assessment
  const handleRemoveQuestion = () => {
    if (!assessmentId || !questionToRemove) return;

    removeQuestion.mutate(
      {
        assessmentId,
        questionId: questionToRemove.id,
      },
      {
        onSuccess: () => {
          toast.success("Question removed from assessment");
          setShowRemoveDialog(false);
          setQuestionToRemove(null);
        },
        onError: (error) => {
          toast.error(`Failed to remove question: ${error.message}`);
        },
      }
    );
  };

  // Handle editing a question
  const handleEditQuestion = (question: OrderedQuestion) => {
    setQuestionToEdit(question);
    setShowEditModal(true);
  };

  // Handle updating an edited question - for now we'll just close the modal
  // Full edit functionality would require useUpdateQuestion mutation
  const handleSaveEditedQuestion = () => {
    // TODO: Implement question update
    toast.info("Question editing will be available soon");
    setShowEditModal(false);
    setQuestionToEdit(null);
  };

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

  const sortedQuestions = [...assessment.questions].sort((a, b) => a.order - b.order);

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
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      {sortedQuestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No questions yet</p>
          <p className="text-sm">Add questions using the button above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => (
            <div key={question.id} className="relative group">
              {/* Drag Handle and Actions Bar */}
              <div className="absolute -left-12 top-4 flex items-center gap-2">
                <div className="cursor-grab opacity-50 group-hover:opacity-100">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div className="absolute -right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditQuestion(question)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowLinkOrDuplicateModal(true);
                      }}
                    >
                      Duplicate to Another Assessment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setQuestionToRemove(question);
                        setShowRemoveDialog(true);
                      }}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Question Card */}
              <QuestionCard
                question={question}
                questionNumber={index + 1}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      <AddQuestionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        assessmentId={assessmentId || ""}
        ownerId={user?.id || ""}
        onCreateManually={handleCreateManually}
        onSelectExisting={handleSelectExisting}
      />

      {/* Create Question Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Question</DialogTitle>
            <DialogDescription>
              Create a new question to add to this assessment.
            </DialogDescription>
          </DialogHeader>
          <QuestionEditor
            onSave={handleSaveNewQuestion}
            onCancel={() => setShowCreateModal(false)}
            isLoading={addQuestion.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Question Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the question.
            </DialogDescription>
          </DialogHeader>
          {questionToEdit && (
            <QuestionEditor
              question={questionToEdit}
              onSave={handleSaveEditedQuestion}
              onCancel={() => {
                setShowEditModal(false);
                setQuestionToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Link or Duplicate Modal */}
      <LinkOrDuplicateModal
        open={showLinkOrDuplicateModal}
        onOpenChange={setShowLinkOrDuplicateModal}
        question={selectedQuestion}
        ownerId={user?.id || ""}
        onLink={handleLinkQuestion}
        onDuplicate={handleDuplicateQuestion}
        isLoading={linkQuestion.isPending || addQuestion.isPending}
      />

      {/* Remove Question Confirmation */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the question from this assessment. The question itself
              will not be deleted and can still be found in your question bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeQuestion.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveQuestion}
              disabled={removeQuestion.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeQuestion.isPending && (
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

export default AssessmentPage;
