import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CodeInfo } from "@/api/models";
import type { TargetSelection } from "@/types/frontend.types";
import TargetSelector from "./TargetSelector";

interface TargetSelectionCardProps {
    codeInfo: CodeInfo;
    onTargetChange: (target: TargetSelection | null) => void;
    initialSelection?: TargetSelection | null;
}

export function TargetSelectionCard({
    codeInfo,
    onTargetChange,
    initialSelection,
}: TargetSelectionCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Step 2: Select Target</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <TargetSelector
                        codeInfo={codeInfo}
                        onTargetChange={onTargetChange}
                        initialSelection={initialSelection}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
