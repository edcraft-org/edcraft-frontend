// SaveQuestionModal - Modal for saving a generated question to an assessment

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, FileText, Folder } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/shared/services/query-client";
import { apiClient } from "@/shared/services/api-client";
import type { Assessment } from "@/features/assessments/types/assessment.types";
import type { Folder as FolderType } from "@/features/folders/types/folder.types";

type SaveMode = "select" | "create";

interface SaveQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  currentFolderId?: string;
  onSaveToNew: (title: string, description: string | undefined, folderId: string) => void;
  onSaveToExisting: (assessmentId: string) => void;
  isLoading?: boolean;
  preSelectedAssessmentId?: string;
}

export function SaveQuestionModal({
  open,
  onOpenChange,
  ownerId,
  currentFolderId,
  onSaveToNew,
  onSaveToExisting,
  isLoading,
  preSelectedAssessmentId,
}: SaveQuestionModalProps) {
  const [mode, setMode] = useState<SaveMode>("select");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || "");

  // Fetch existing assessments
  const { data: assessments, isLoading: loadingAssessments } = useQuery({
    queryKey: queryKeys.assessments.all(ownerId),
    queryFn: ({ signal }) =>
      apiClient.get<Assessment[]>(
        `/assessments?owner_id=${ownerId}`,
        signal
      ),
    enabled: open && !!ownerId,
  });

  // Fetch folders for folder selection
  const { data: folders } = useQuery({
    queryKey: queryKeys.folders.all(ownerId),
    queryFn: ({ signal }) =>
      apiClient.get<FolderType[]>(
        `/folders?owner_id=${ownerId}`,
        signal
      ),
    enabled: open && !!ownerId && mode === "create",
  });

  const filteredAssessments =
    assessments?.filter((a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleClose = () => {
    onOpenChange(false);
    setMode("select");
    setNewTitle("");
    setNewDescription("");
    setSearchQuery("");
    setSelectedFolderId(currentFolderId || "");
  };

  const handleSaveToNew = () => {
    if (!newTitle.trim() || !selectedFolderId) return;
    onSaveToNew(newTitle.trim(), newDescription.trim() || undefined, selectedFolderId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "select" && "Save Question"}
            {mode === "create" && "Create New Assessment"}
          </DialogTitle>
          <DialogDescription>
            {mode === "select" &&
              "Choose where to save this question."}
            {mode === "create" &&
              "Create a new assessment to save this question to."}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto py-4 justify-start"
              onClick={() => setMode("create")}
            >
              <div className="flex items-start gap-3">
                <Plus className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Create New Assessment</div>
                  <div className="text-sm text-muted-foreground">
                    Start a new assessment to hold this and future questions
                  </div>
                </div>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or add to existing
                </span>
              </div>
            </div>

            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
              {loadingAssessments ? (
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
                        preSelectedAssessmentId === assessment.id ? "border-primary" : ""
                      }`}
                      onClick={() => {
                        if (!isLoading) {
                          onSaveToExisting(assessment.id);
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
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("select")}
            >
              ← Back
            </Button>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1 Quiz"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this assessment is for..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder *</Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder">
                    {folders?.find(f => f.id === selectedFolderId)?.name || "Select folder"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("select")}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveToNew}
                disabled={!newTitle.trim() || !selectedFolderId || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create & Save
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
