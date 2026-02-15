// CreateQuestionBankForm - Form for creating a new question bank

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Folder, Loader2 } from "lucide-react";
import type { FolderResponse } from "@/api/models";

interface CreateQuestionBankFormProps {
    title: string;
    description: string;
    selectedFolderId: string;
    folders?: FolderResponse[];
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onFolderChange: (folderId: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    showBackButton?: boolean;
}

export function CreateQuestionBankForm({
    title,
    description,
    selectedFolderId,
    folders,
    onTitleChange,
    onDescriptionChange,
    onFolderChange,
    onSubmit,
    onCancel,
    isLoading = false,
    showBackButton = true,
}: CreateQuestionBankFormProps) {
    const isValid = title.trim() && selectedFolderId;

    return (
        <>
            <div className="space-y-4">
                {showBackButton && (
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        ← Back
                    </Button>
                )}

                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        placeholder="e.g., BFS Questions"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe what this question bank is for..."
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="folder">Folder *</Label>
                    <Select value={selectedFolderId} onValueChange={onFolderChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select folder">
                                {folders?.find((f) => f.id === selectedFolderId)?.name ||
                                    "Select folder"}
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
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button onClick={onSubmit} disabled={!isValid || isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create & Save
                </Button>
            </DialogFooter>
        </>
    );
}
