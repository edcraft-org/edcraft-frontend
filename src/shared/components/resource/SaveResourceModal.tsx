import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";
import { CreateEntityForm } from "@/shared/components/resource/CreateResourceEntityForm";
import type { FolderResponse } from "@/api/models/folderResponse";
import type { ResourceBrowserItem } from "@/shared/components/resource/ResourceBrowser";

type Mode = "select" | "create";

export interface ResourceConfig<T extends ResourceBrowserItem> {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;

    createTitle: string;
    createDescription: string;

    formConfig: {
        titlePlaceholder: string;
        descriptionPlaceholder: string;
    };

    data?: T[];
    isLoading?: boolean;
    disabled?: boolean;
    preSelectedId?: string;

    Browser: React.ComponentType<{
        data: T[];
        isLoading?: boolean;
        onSelect: (id: string) => void;
        disabled?: boolean;
        preSelectedId?: string;
    }>;

    onSelect: (id: string) => void;
    onCreate: (data: { title: string; description?: string; folderId: string }) => void;
}

interface SaveResourceModalProps<T extends ResourceBrowserItem> {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    title: string;
    description: string;

    resources: ResourceConfig<T>[];

    folders?: FolderResponse[];
    currentFolderId: string;
    
    initialResourceKey?: string;
}

export function SaveResourceModal<T extends ResourceBrowserItem>({
    open,
    onOpenChange,
    title,
    description,
    resources,
    folders,
    currentFolderId,
    initialResourceKey,
}: SaveResourceModalProps<T>) {
    const [selected, setSelected] = useState<string | null>(initialResourceKey ?? null);
    const [mode, setMode] = useState<Mode>("select");

    useEffect(() => {
        if (open) {
            setSelected(initialResourceKey ?? null);
            setMode("select");
        }
    }, [open, initialResourceKey]);

    const active = resources.find((r) => r.key === selected);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" && active ? active.createTitle : title}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create" && active ? active.createDescription : description}
                    </DialogDescription>
                </DialogHeader>

                {/* Destination */}
                {!selected && (
                    <div className="grid gap-3 py-4">
                        {resources.map((r) => {
                            const Icon = r.icon;
                            return (
                                <Card
                                    key={r.key}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelected(r.key)}
                                >
                                    <CardContent className="p-4 flex gap-4">
                                        <Icon className="h-6 w-6 text-primary" />
                                        <div>
                                            <div className="font-medium">{r.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {r.description}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Selected */}
                {selected && active && (
                    <>
                        {mode === "select" && (
                            <div className="space-y-4">
                                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                                    ← Back
                                </Button>

                                <div className="grid gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 px-4 justify-start"
                                        onClick={() => setMode("create")}
                                    >
                                        <div className="flex gap-4">
                                            <Plus className="h-5 w-5 text-primary" />
                                            <div>
                                                <div className="font-medium">
                                                    {active.createTitle}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {active.createDescription}
                                                </div>
                                            </div>
                                        </div>
                                    </Button>

                                    <div className="text-center text-xs text-muted-foreground uppercase">
                                        or add to existing
                                    </div>

                                    {active.data && (
                                        <active.Browser
                                            data={active.data}
                                            isLoading={active.isLoading}
                                            onSelect={active.onSelect}
                                            disabled={active.disabled}
                                            preSelectedId={active.preSelectedId}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {mode === "create" && (
                            <CreateEntityForm
                                folders={folders}
                                defaultFolderId={currentFolderId}
                                onSubmit={active.onCreate}
                                onCancel={() => setMode("select")}
                                isLoading={active.disabled}
                                config={active.formConfig}
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
