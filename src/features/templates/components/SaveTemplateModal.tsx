// SaveTemplateModal - Modal for saving a question template to an assessment template

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
import { Loader2, Plus, FileStack } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/services/query-client";
import { apiClient } from "@/shared/services/api-client";
import type { AssessmentTemplate } from "@/features/assessment-templates/types/assessment-template.types";

type SaveMode = "select" | "create";

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  onSaveToNew: (title: string, description?: string) => void;
  onSaveToExisting: (assessmentTemplateId: string) => void;
  isLoading?: boolean;
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  ownerId,
  onSaveToNew,
  onSaveToExisting,
  isLoading,
}: SaveTemplateModalProps) {
  const [mode, setMode] = useState<SaveMode>("select");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch existing assessment templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: queryKeys.assessmentTemplates.all(ownerId),
    queryFn: ({ signal }) =>
      apiClient.get<AssessmentTemplate[]>(
        `/assessment-templates?owner_id=${ownerId}`,
        signal
      ),
    enabled: open && !!ownerId,
  });

  const filteredTemplates =
    templates?.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleClose = () => {
    onOpenChange(false);
    setMode("select");
    setNewTitle("");
    setNewDescription("");
    setSearchQuery("");
  };

  const handleSaveToNew = () => {
    if (!newTitle.trim()) return;
    onSaveToNew(newTitle.trim(), newDescription.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "select" && "Save Question Template"}
            {mode === "create" && "Create New Template Bank"}
          </DialogTitle>
          <DialogDescription>
            {mode === "select" &&
              "Choose where to save this question template."}
            {mode === "create" &&
              "Create a new assessment template (template bank) to save this question template to."}
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
                  <div className="font-medium">Create New Template Bank</div>
                  <div className="text-sm text-muted-foreground">
                    Start a new assessment template to hold this and future templates
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
              placeholder="Search template banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No template banks match your search"
                    : "No template banks yet. Create one above."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (!isLoading) {
                          onSaveToExisting(template.id);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <FileStack className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {template.title}
                            </p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {template.description}
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
                placeholder="e.g., Basic Arithmetic Templates"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this template bank is for..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("select")}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveToNew}
                disabled={!newTitle.trim() || isLoading}
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
