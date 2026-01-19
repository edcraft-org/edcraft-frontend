// RenameModal - Modal for renaming folders, assessments, and assessment templates

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

interface RenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description?: string) => void;
  isLoading?: boolean;
  resourceType: "folder" | "assessment" | "assessment_template";
  currentName: string;
  currentDescription?: string | null;
}

export function RenameModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  resourceType,
  currentName,
  currentDescription,
}: RenameModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Update local state when modal opens with new values
  useEffect(() => {
    if (open) {
      setName(currentName);
      setDescription(currentDescription || "");
    }
  }, [open, currentName, currentDescription]);

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim() || undefined);
  };

  const getTitle = () => {
    switch (resourceType) {
      case "folder":
        return "Rename Folder";
      case "assessment":
        return "Rename Assessment";
      case "assessment_template":
        return "Rename Assessment Template";
    }
  };

  const getFieldLabel = () => {
    return resourceType === "folder" ? "Name" : "Title";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Update the {getFieldLabel().toLowerCase()} and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rename-name">{getFieldLabel()} *</Label>
            <Input
              id="rename-name"
              placeholder={`Enter ${getFieldLabel().toLowerCase()}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rename-description">Description (optional)</Label>
            <Textarea
              id="rename-description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
