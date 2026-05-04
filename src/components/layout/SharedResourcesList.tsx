// SharedResourcesList - Shared resources grouped by type, lazily fetched on expand

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useSharedAssessments } from "@/features/assessments/hooks/useAssessments";
import { useSharedAssessmentTemplates } from "@/features/assessment-templates/hooks/useAssessmentTemplates";
import { useSharedQuestionBanks } from "@/features/question-banks/hooks/useQuestionBanks";
import { useSharedQuestionTemplateBanks } from "@/features/question-template-banks/hooks/useQuestionTemplateBanks";
import { CollaboratorRole } from "@/api/models";
import type { CollaboratorRole as CollaboratorRoleType } from "@/api/models";
import { ROUTES } from "@/router/paths";

interface Resource {
    id: string;
    title: string;
    my_role?: CollaboratorRoleType | null;
}

interface SectionProps {
    label: string;
    useItems: (enabled: boolean) => { data: Resource[] | undefined; isLoading: boolean };
    getRoute: (id: string) => string;
}

function Section({ label, useItems, getRoute }: SectionProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useItems(open);

    return (
        <div>
            <button
                className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                onClick={() => setOpen((o) => !o)}
            >
                <ChevronRight
                    className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
                />
                {label}
            </button>

            {open && (
                <div className="space-y-0.5 pb-1">
                    {isLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-8 rounded-md mx-2"
                                style={{ width: "calc(100% - 16px)" }}
                            />
                        ))
                    ) : !data || data.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-4 py-1">None</p>
                    ) : (
                        data.map((item) => (
                            <button
                                key={item.id}
                                className="w-full text-left rounded-md px-4 py-1.5 hover:bg-accent transition-colors flex items-center gap-2"
                                onClick={() => navigate(getRoute(item.id))}
                            >
                                <p className="text-sm truncate flex-1">{item.title}</p>
                                {item.my_role && item.my_role !== CollaboratorRole.owner && (
                                    <Badge
                                        variant={
                                            item.my_role === CollaboratorRole.editor
                                                ? "secondary"
                                                : "outline"
                                        }
                                        className="text-xs shrink-0"
                                    >
                                        {item.my_role === CollaboratorRole.editor
                                            ? "Editor"
                                            : "Viewer"}
                                    </Badge>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const SECTIONS: SectionProps[] = [
    { label: "Assessments", useItems: useSharedAssessments, getRoute: ROUTES.ASSESSMENT },
    {
        label: "Assessment Templates",
        useItems: useSharedAssessmentTemplates,
        getRoute: ROUTES.ASSESSMENT_TEMPLATE,
    },
    { label: "Question Banks", useItems: useSharedQuestionBanks, getRoute: ROUTES.QUESTION_BANK },
    {
        label: "Question Template Banks",
        useItems: useSharedQuestionTemplateBanks,
        getRoute: ROUTES.QUESTION_TEMPLATE_BANK,
    },
];

export function SharedResourcesList() {
    return (
        <div className="p-2 space-y-1">
            {SECTIONS.map((section) => (
                <Section key={section.label} {...section} />
            ))}
        </div>
    );
}
