import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import type { EntryFunctionParams } from "@/api/models";
import { InputDataTypeConfig } from "@/features/template-input-data/components/InputDataTypeConfig";

interface InputDataConfigCardProps {
    entryFunctionParams?: EntryFunctionParams;
    initialConfig?: Record<string, Record<string, unknown>>;
    onConfigChange: (config: Record<string, Record<string, unknown>>) => void;
}

export function InputDataConfigCard({
    entryFunctionParams,
    initialConfig,
    onConfigChange,
}: InputDataConfigCardProps) {
    const [paramConfigs, setParamConfigs] = useState<Record<string, Record<string, unknown>>>(
        initialConfig ?? {},
    );

    // Sync when initialConfig prop changes (e.g. when template loads in edit mode)
    const initialConfigRef = useRef<string>("");
    useEffect(() => {
        const next = JSON.stringify(initialConfig ?? {});
        if (next !== initialConfigRef.current) {
            initialConfigRef.current = next;
            setParamConfigs(initialConfig ?? {});
        }
    }, [initialConfig]);

    const updateParamConfig = (paramName: string, config: Record<string, unknown>) => {
        setParamConfigs((prev) => {
            const next =
                Object.keys(config).length === 0
                    ? (() => {
                          const { [paramName]: _, ...rest } = prev;
                          return rest;
                      })()
                    : { ...prev, [paramName]: config };
            onConfigChange(next);
            return next;
        });
    };

    const fixedParamNames = entryFunctionParams?.parameters ?? [];

    if (!entryFunctionParams || fixedParamNames.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Input Data Config
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-6 text-center text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">
                        Select an entry function to configure input schemas.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Input Data Config
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                    Define the type schema for each parameter. This config will be pre-populated
                    when generating questions from this template.
                </p>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/30 p-3 rounded-md space-y-4">
                    {fixedParamNames.map((paramName) => (
                        <div key={paramName} className="flex items-start gap-3">
                            <span className="text-sm font-medium w-[120px] flex-shrink-0 pt-1">
                                {paramName}
                            </span>
                            <InputDataTypeConfig
                                paramName={paramName}
                                config={paramConfigs[paramName] ?? {}}
                                onChange={(cfg) => updateParamConfig(paramName, cfg)}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
