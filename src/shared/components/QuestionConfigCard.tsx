import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { CodeInfo } from "@/api/models";
import type { QuestionType } from "@/constants";

interface QuestionConfigCardProps<T extends FieldValues = FieldValues> {
    control: Control<T>;
    codeInfo: CodeInfo;
    questionType: QuestionType;
}

export function QuestionConfigCard<T extends FieldValues = FieldValues>({ control, codeInfo, questionType }: QuestionConfigCardProps<T>) {
    const entryFunctionOptions = codeInfo?.functions.filter((f) => f.is_definition) || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Step 3: Configure Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name={"entryFunction" as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Entry Function</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select entry function" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {entryFunctionOptions.length === 0 ? (
                                        <div className="py-2 px-2 text-sm text-muted-foreground">
                                            No functions found in code
                                        </div>
                                    ) : (
                                        entryFunctionOptions.map((func) => (
                                            <SelectItem
                                                key={`${func.name}-${func.line_number}`}
                                                value={func.name}
                                            >
                                                {func.name} (Line {func.line_number})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name={"outputType" as Path<T>}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Output Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="first">First</SelectItem>
                                        <SelectItem value="last">Last</SelectItem>
                                        <SelectItem value="list">List</SelectItem>
                                        <SelectItem value="count">Count</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name={"questionType" as Path<T>}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                        <SelectItem value="mrq">Multiple Response</SelectItem>
                                        <SelectItem value="short_answer">Short Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {(questionType === "mcq" || questionType === "mrq") && (
                    <FormField
                        control={control}
                        name={"numDistractors" as Path<T>}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Number of Distractors</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </CardContent>
        </Card>
    );
}
