// TemplateConfigSummary.tsx
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateConfigSummaryProps {
    entryFunction: string;
    outputType: string;
    questionType: string;
    numDistractors: number;
    className?: string;
}

export function TemplateConfigSummary({
    entryFunction,
    outputType,
    questionType,
    numDistractors,
    className,
}: TemplateConfigSummaryProps) {
    const content = (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Code2 className="h-4 w-4" />
                <span>Template Configuration</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="text-muted-foreground">Entry Function:</span>
                    <span className="ml-2 font-mono">{entryFunction}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Output Type:</span>
                    <span className="ml-2">{outputType}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Question Type:</span>
                    <span className="ml-2">{questionType}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">Distractors:</span>
                    <span className="ml-2">{numDistractors}</span>
                </div>
            </div>
        </div>
    );

    return content;
}
