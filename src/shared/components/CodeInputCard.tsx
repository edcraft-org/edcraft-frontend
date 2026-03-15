import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, Code2, Search } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit, bracketMatching } from "@codemirror/language";
import { keymap, highlightActiveLine } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

const extensions = [
    python(),
    bracketMatching(),
    highlightActiveLine(),
    indentUnit.of("    "),
    keymap.of([indentWithTab]),
];

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
                                <div className="border border-input rounded-md overflow-hidden">
                                    <CodeMirror
                                        value={field.value}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            onCodeChange(val);
                                        }}
                                        extensions={extensions}
                                        editable={!isAnalysing}
                                        minHeight="200px"
                                        theme="light"
                                        placeholder={"def example(n):\n    return n * 2"}
                                    />
                                </div>
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
