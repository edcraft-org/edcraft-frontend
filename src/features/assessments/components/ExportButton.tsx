import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown, FileText, Sheet, Loader2, FileType } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
    exportAssessmentAsPdf,
    exportAssessmentAsCsv,
    exportAssessmentAsDocx,
    exportAssessmentAsRtf,
} from "@/shared/utils/assessmentExportUtils";
import type { ExportMode } from "@/shared/utils/assessmentExportUtils";
import type { AssessmentWithQuestionsResponse } from "@/api/models";

type ExportFormat = "pdf" | "csv" | "rtf" | "docx";

interface FormatConfig {
    format: ExportFormat;
    label: string;
    icon: LucideIcon;
    async: boolean;
}

const FORMAT_CONFIGS: FormatConfig[] = [
    { format: "pdf", label: "Export as PDF", icon: FileText, async: true },
    { format: "docx", label: "Export as Word (.docx)", icon: FileType, async: true },
    { format: "rtf", label: "Export as RTF", icon: FileType, async: false },
    { format: "csv", label: "Export as CSV", icon: Sheet, async: false },
];

const SECTION_CONFIGS: { label: string; mode: ExportMode }[] = [
    { label: "Assessment", mode: "assessment" },
    { label: "Answer Sheet", mode: "answer-sheet" },
];

interface ExportButtonProps {
    assessment: AssessmentWithQuestionsResponse;
}

export function ExportButton({ assessment }: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
    const isExporting = loadingFormat !== null;

    const handleExport = async (format: ExportFormat, mode: ExportMode) => {
        setOpen(false);
        if (format === "csv") {
            exportAssessmentAsCsv({ assessment, mode });
            return;
        }
        if (format === "rtf") {
            exportAssessmentAsRtf({ assessment, mode });
            return;
        }
        setLoadingFormat(format);
        try {
            if (format === "pdf") await exportAssessmentAsPdf({ assessment, mode });
            if (format === "docx") await exportAssessmentAsDocx({ assessment, mode });
        } catch {
            toast.error(`Failed to export ${format.toUpperCase()}`);
        } finally {
            setLoadingFormat(null);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {SECTION_CONFIGS.map(({ label, mode }, i) => (
                    <>
                        {i > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel key={label}>{label}</DropdownMenuLabel>
                        {FORMAT_CONFIGS.map(
                            ({ format, label: fmtLabel, icon: Icon, async: isAsync }) => (
                                <DropdownMenuItem
                                    key={format}
                                    onSelect={() => handleExport(format, mode)}
                                    disabled={isExporting}
                                >
                                    {isAsync && loadingFormat === format ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Icon className="h-4 w-4 mr-2" />
                                    )}
                                    {fmtLabel}
                                </DropdownMenuItem>
                            ),
                        )}
                    </>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
