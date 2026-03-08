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
import { Download, ChevronDown, FileText, Sheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportAssessmentAsPdf, exportAssessmentAsCsv } from "@/shared/utils/assessmentExportUtils";
import type { ExportMode } from "@/shared/utils/assessmentExportUtils";
import type { AssessmentWithQuestionsResponse } from "@/api/models";

interface ExportButtonProps {
    assessment: AssessmentWithQuestionsResponse;
}

export function ExportButton({ assessment }: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: "pdf" | "csv", mode: ExportMode) => {
        setOpen(false);
        if (format === "csv") {
            exportAssessmentAsCsv({ assessment, mode });
            return;
        }
        setIsExporting(true);
        try {
            await exportAssessmentAsPdf({ assessment, mode });
        } catch {
            toast.error("Failed to export PDF");
        } finally {
            setIsExporting(false);
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
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Assessment</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleExport("pdf", "assessment")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport("csv", "assessment")}>
                    <Sheet className="h-4 w-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Answer Sheet</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleExport("pdf", "answer-sheet")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport("csv", "answer-sheet")}>
                    <Sheet className="h-4 w-4 mr-2" />
                    Export as CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
