import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetSelector } from "@/shared/components/target-selector";
import type { CodeInfo } from "@/api/models";
import type { TargetSelection } from "@/types/frontend.types";

interface TargetSelectionCardProps {
    codeInfo: CodeInfo;
    onTargetChange: (target: TargetSelection | null) => void;
}

export function TargetSelectionCard({ codeInfo, onTargetChange }: TargetSelectionCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Step 2: Select Target</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <TargetSelector codeInfo={codeInfo} onTargetChange={onTargetChange} />
                </div>
            </CardContent>
        </Card>
    );
}
