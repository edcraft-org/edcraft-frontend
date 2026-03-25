import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Code2, Search, X } from "lucide-react";
import { useState } from "react";
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
    onCancelAnalysis?: () => void;
    isAnalysing: boolean;
    analysisError?: string | null;
    hasExistingSelection?: boolean;
}

export function CodeInputCard<T extends FieldValues = FieldValues>({
    control,
    code,
    onCodeChange,
    onAnalyseCode,
    onCancelAnalysis,
    isAnalysing,
    analysisError,
    hasExistingSelection = false,
}: CodeInputCardProps<T>) {
    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

    const handleAnalyseClick = () => {
        if (hasExistingSelection) {
            setShowOverwriteWarning(true);
        } else {
            onAnalyseCode();
        }
    };

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
                {isAnalysing ? (
                    <div className="flex gap-2">
                        <Button className="flex-1" variant="secondary" disabled>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Analysing Code...
                        </Button>
                        {onCancelAnalysis && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={onCancelAnalysis}
                                aria-label="Cancel analysis"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button
                        className="w-full"
                        variant="secondary"
                        onClick={handleAnalyseClick}
                        disabled={!code.trim()}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Analyse Code
                    </Button>
                )}
            </CardContent>
            <AlertDialog open={showOverwriteWarning} onOpenChange={setShowOverwriteWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Analyse code?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Re-analysing the code may overwrite your current target selections and
                            input configurations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowOverwriteWarning(false);
                                onAnalyseCode();
                            }}
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
