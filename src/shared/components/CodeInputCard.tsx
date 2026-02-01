import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, Code2, Search } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";

interface CodeInputCardProps<T extends FieldValues = FieldValues> {
    control: Control<T>;
    code: string;
    onCodeChange: (code: string) => void;
    onAnalyseCode: () => void;
    isAnalysing: boolean;
    analysisError?: string | null;
}

export function CodeInputCard<T extends FieldValues = FieldValues>({
    control,
    code,
    onCodeChange,
    onAnalyseCode,
    isAnalysing,
    analysisError,
}: CodeInputCardProps<T>) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Step 1: Input Code
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name={"code" as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder="def example(n):&#10;    return n * 2"
                                    className="font-mono text-sm min-h-[200px]"
                                    {...field}
                                    onChange={(e) => onCodeChange(e.target.value)}
                                    disabled={isAnalysing}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {analysisError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{analysisError}</p>
                    </div>
                )}
                <Button
                    className="w-full"
                    variant="secondary"
                    onClick={onAnalyseCode}
                    disabled={isAnalysing || !code.trim()}
                >
                    {isAnalysing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Analysing Code...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4 mr-2" />
                            Analyse Code
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
