// AddQuestionTemplateModal - Modal for adding question templates to an assessment template

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
import { Wand2, Search } from "lucide-react";
import { ROUTES } from "@/router/paths";
import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateBrowser } from "./QuestionTemplateBrowser";

type ModalView = "options" | "browse";

interface AddQuestionTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    destination:
        | { type: "assessmentTemplate"; id: string }
        | { type: "templateBank"; id: string };
    ownerId: string;
    onSelectExisting: (template: QuestionTemplateResponse) => void;
}

export function AddQuestionTemplateModal({
    open,
    onOpenChange,
    destination,
    ownerId,
    onSelectExisting,
}: AddQuestionTemplateModalProps) {
    const navigate = useNavigate();
    const [view, setView] = useState<ModalView>("options");

    const handleClose = () => {
        onOpenChange(false);
        setView("options");
    };

    const handleGenerateNew = () => {
        if (destination.type === "assessmentTemplate") {
            navigate(`${ROUTES.TEMPLATE_BUILDER}?assessmentTemplateId=${destination.id}`);
        } else {
            navigate(`${ROUTES.TEMPLATE_BUILDER}?bankId=${destination.id}`);
        }
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {view === "options" && "Add Question Template"}
                        {view === "browse" && "Select Template from Bank"}
                    </DialogTitle>
                    <DialogDescription>
                        {view === "options" && "Choose how you want to add a question template."}
                        {view === "browse" &&
                            "Browse and select a question template from your template bank."}
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
                                    <div className="font-medium">
                                        Generate from Template Builder
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Use the template builder to create a new question template
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
                                    <div className="font-medium">Select from Template Bank</div>
                                    <div className="text-sm text-muted-foreground">
                                        Browse and select from your existing question templates
                                    </div>
                                </div>
                            </div>
                        </Button>
                    </div>
                )}

                {view === "browse" && (
                    <QuestionTemplateBrowser
                        ownerId={ownerId}
                        onSelectTemplate={onSelectExisting}
                        onBack={() => setView("options")}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
