import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

/**
 * Schema factory (so you can tweak later if needed)
 */
const createSchema = () =>
    z.object({
        title: z.string().trim().min(1, "Title is required"),
        description: z.string().optional(),
        folderId: z.string().min(1, "Folder is required"),
    });

export type CreateCollectionFormData = z.infer<ReturnType<typeof createSchema>>;

interface CreateCollectionFormConfig {
    titleLabel?: string;
    titlePlaceholder?: string;
    descriptionPlaceholder?: string;
}

interface Props {
    folders?: FolderResponse[];
    defaultFolderId?: string;

    onSubmit: (data: CreateCollectionFormData) => void;
    onCancel: () => void;

    isLoading?: boolean;
    showBackButton?: boolean;

    config: CreateCollectionFormConfig;
}

export function CreateCollectionForm({
    folders,
    defaultFolderId,
    onSubmit,
    onCancel,
    isLoading = false,
    showBackButton = true,
    config,
}: Props) {
    const schema = createSchema();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateCollectionFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            description: "",
            folderId: defaultFolderId || "",
        },
    });

    const selectedFolderId = watch("folderId");

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
                {showBackButton && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        ← Back
                    </Button>
                )}

                {/* Title */}
                <div className="space-y-2">
                    <Label>{config.titleLabel || "Title *"}</Label>
                    <Input
                        placeholder={config.titlePlaceholder}
                        {...register("title")}
                    />
                    {errors.title && (
                        <p className="text-sm text-destructive">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        placeholder={config.descriptionPlaceholder}
                        {...register("description")}
                    />
                </div>

                {/* Folder */}
                <div className="space-y-2">
                    <Label>Folder *</Label>
                    <Select
                        value={selectedFolderId}
                        onValueChange={(val) => setValue("folderId", val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select folder" />
                        </SelectTrigger>
                        <SelectContent>
                            {folders?.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4" />
                                        {f.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.folderId && (
                        <p className="text-sm text-destructive">
                            {errors.folderId.message}
                        </p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Create
                </Button>
            </DialogFooter>
        </form>
    );
}
