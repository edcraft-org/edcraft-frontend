// AddQuestionModal - Modal for adding questions to an assessment

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, PenLine, Search, Loader2 } from "lucide-react";
import { ROUTES } from "@/router/paths";
import { useQuestions } from "../hooks/useQuestions";
import type { Question } from "../types/question.types";

type ModalView = "options" | "create" | "browse";

interface AddQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  ownerId: string;
  onCreateManually: () => void;
  onSelectExisting: (question: Question) => void;
}

export function AddQuestionModal({
  open,
  onOpenChange,
  assessmentId,
  ownerId,
  onCreateManually,
  onSelectExisting,
}: AddQuestionModalProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<ModalView>("options");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: questions, isLoading } = useQuestions(view === "browse" ? ownerId : null);

  const filteredQuestions =
    questions?.filter((q) =>
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleClose = () => {
    onOpenChange(false);
    setView("options");
    setSearchQuery("");
  };

  const handleGenerateNew = () => {
    navigate(`${ROUTES.QUESTION_BUILDER}?destination=${assessmentId}`);
    handleClose();
  };

  const handleCreateManually = () => {
    onCreateManually();
    handleClose();
  };

  const handleSelectQuestion = (question: Question) => {
    onSelectExisting(question);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {view === "options" && "Add Question"}
            {view === "browse" && "Select Existing Question"}
          </DialogTitle>
          <DialogDescription>
            {view === "options" && "Choose how you want to add a question to this assessment."}
            {view === "browse" && "Browse and select a question from your question bank."}
          </DialogDescription>
        </DialogHeader>

        {view === "options" && (
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start"
              onClick={handleGenerateNew}
            >
              <div className="flex items-start gap-4">
                <Wand2 className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Generate New Question</div>
                  <div className="text-sm text-muted-foreground">
                    Use the question generator to create a new question from code
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start"
              onClick={handleCreateManually}
            >
              <div className="flex items-start gap-4">
                <PenLine className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Create Manually</div>
                  <div className="text-sm text-muted-foreground">
                    Write a question by hand with custom options
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 px-4 justify-start"
              onClick={() => setView("browse")}
            >
              <div className="flex items-start gap-4">
                <Search className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Add Existing Question</div>
                  <div className="text-sm text-muted-foreground">
                    Browse and select from your question bank
                  </div>
                </div>
              </div>
            </Button>
          </div>
        )}

        {view === "browse" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("options")}>
                ← Back
              </Button>
            </div>

            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No questions match your search" : "No questions in your bank yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectQuestion(question)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{question.question_text}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-muted rounded shrink-0">
                            {question.question_type.toUpperCase()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
