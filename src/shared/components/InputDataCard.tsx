import { useEffect, useRef, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Form,
} from "@/components/ui/form";
import { Database, Plus, Trash2, HelpCircle } from "lucide-react";
import type { EntryFunctionParams } from "@/api/models";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface InputDataCardProps {
    onInputDataChange: (data: Record<string, unknown>) => void;
    onValidationChange?: (isValid: boolean) => void;
    entryFunctionParams?: EntryFunctionParams;
    title?: string;
}

const createInputDataSchema = (fixedParamNames: string[]) =>
    z
        .object({
            fixedParams: z.record(z.string(), z.string().min(1, "Value is required")),
            varArgs: z
                .array(
                    z.object({
                        key: z.string().min(1, "Key is required"),
                        value: z.string().min(1, "Value is required"),
                    }),
                )
                .optional(),
        })
        .superRefine((data, ctx) => {
            // Validation: Ensure variable keys don't overlap with fixed params or each other
            if (data.varArgs && data.varArgs.length > 0) {
                const varKeys = data.varArgs.map((arg) => arg.key);

                const seenKeys = new Set<string>();
                const duplicateIndices: number[] = [];

                varKeys.forEach((key, index) => {
                    if (seenKeys.has(key)) {
                        duplicateIndices.push(index);
                    } else {
                        seenKeys.add(key);
                    }
                });

                if (duplicateIndices.length > 0) {
                    duplicateIndices.forEach((index) => {
                        ctx.addIssue({
                            code: "custom",
                            message: `Duplicate key "${varKeys[index]}"`,
                            path: ["varArgs", index, "key"],
                        });
                    });
                }

                varKeys.forEach((key, index) => {
                    if (fixedParamNames.includes(key)) {
                        ctx.addIssue({
                            code: "custom",
                            message: `Key "${key}" overlaps with a fixed parameter`,
                            path: ["varArgs", index, "key"],
                        });
                    }
                });
            }
        });

type InputDataFormValues = {
    fixedParams: Record<string, string>;
    varArgs?: Array<{ key: string; value: string }>;
};

export function InputDataCard({
    onInputDataChange,
    onValidationChange,
    entryFunctionParams,
    title = "Input Data",
}: InputDataCardProps) {
    // Helper function to merge and parse form data
    const mergeFormData = (
        fixedParams: Record<string, string>,
        varArgs?: Array<{ key: string; value: string }>,
    ): Record<string, unknown> => {
        const merged: Record<string, unknown> = {};

        Object.entries(fixedParams).forEach(([key, value]) => {
            try {
                merged[key] = JSON.parse(value);
            } catch {
                merged[key] = value;
            }
        });

        varArgs?.forEach(({ key, value }) => {
            try {
                merged[key] = JSON.parse(value);
            } catch {
                merged[key] = value;
            }
        });

        return merged;
    };

    const fixedParamNames = useMemo(
        () => entryFunctionParams?.parameters || [],
        [entryFunctionParams?.parameters],
    );

    const defaultFixedParams = fixedParamNames.reduce(
        (acc, param) => {
            acc[param] = "";
            return acc;
        },
        {} as Record<string, string>,
    );

    const internalForm = useForm<InputDataFormValues>({
        resolver: zodResolver(createInputDataSchema(fixedParamNames)),
        defaultValues: {
            fixedParams: defaultFixedParams,
            varArgs: [],
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: internalForm.control,
        name: "varArgs",
    });

    const watchedValues = internalForm.watch();
    const formState = internalForm.formState;

    // Use refs to track previous values and prevent unnecessary updates
    const previousDataRef = useRef<string>("");
    const previousValidRef = useRef<boolean>(true);
    const previousParamsRef = useRef<string>(JSON.stringify(fixedParamNames));

    // Reset form when parameters change (i.e., when entry function changes)
    useEffect(() => {
        const currentParamsString = JSON.stringify(fixedParamNames);
        if (currentParamsString !== previousParamsRef.current) {
            previousParamsRef.current = currentParamsString;

            const newDefaultFixedParams = fixedParamNames.reduce(
                (acc, param) => {
                    acc[param] = "";
                    return acc;
                },
                {} as Record<string, string>,
            );

            internalForm.reset({
                fixedParams: newDefaultFixedParams,
                varArgs: [],
            });
        }
    }, [fixedParamNames, internalForm]);

    useEffect(() => {
        const mergedData = mergeFormData(watchedValues.fixedParams, watchedValues.varArgs);
        const dataString = JSON.stringify(mergedData);

        if (dataString !== previousDataRef.current) {
            previousDataRef.current = dataString;
            onInputDataChange(mergedData);
        }

        if (onValidationChange && formState.isValid !== previousValidRef.current) {
            previousValidRef.current = formState.isValid;
            onValidationChange(formState.isValid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedValues, formState.isValid]);

    // Show empty state if no parameters
    if (!entryFunctionParams || fixedParamNames.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No parameters required</p>
                    <p className="text-sm">This function doesn&apos;t require any input data.</p>
                </CardContent>
            </Card>
        );
    }

    const hasVarArgs = entryFunctionParams.has_var_args || entryFunctionParams.has_var_kwargs;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {title}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p className="text-sm">
                                    Enter values as JSON primitives. Examples:
                                    <br />• Arrays: <code>[1, 2, 3]</code>
                                    <br />• Strings: <code>&quot;hello&quot;</code>
                                    <br />• Numbers: <code>42</code>
                                    <br />• Booleans: <code>true</code> or <code>false</code>
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...internalForm}>
                    <form className="space-y-4">
                        {/* Fixed Parameters Section */}
                        {fixedParamNames.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium">Fixed Parameters</h4>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-md space-y-2">
                                    {fixedParamNames.map((paramName) => (
                                        <FormField
                                            key={paramName}
                                            control={internalForm.control}
                                            name={`fixedParams.${paramName}` as const}
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <FormLabel
                                                            htmlFor={`param-${paramName}`}
                                                            className="text-sm font-medium w-[120px] flex-shrink-0"
                                                        >
                                                            {paramName}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                id={`param-${paramName}`}
                                                                placeholder='e.g., [1, 2, 3] or "hello"'
                                                                className="font-mono text-sm flex-1"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage className="ml-[132px]" />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Variable Arguments Section */}
                        {hasVarArgs && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Additional Parameters</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ key: "", value: "" })}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Parameter
                                    </Button>
                                </div>

                                {fields.length > 0 && (
                                    <div className="bg-muted/30 rounded-md border border-border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Key</TableHead>
                                                    <TableHead>Value</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fields.map((field, index) => (
                                                    <TableRow key={field.id}>
                                                        <TableCell>
                                                            <FormField
                                                                control={internalForm.control}
                                                                name={`varArgs.${index}.key`}
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-0">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="parameter_name"
                                                                                className="h-9"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage className="text-xs mt-1" />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={internalForm.control}
                                                                name={`varArgs.${index}.value`}
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-0">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="value"
                                                                                className="font-mono text-sm h-9"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage className="text-xs mt-1" />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => remove(index)}
                                                                className="h-8 w-8"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {fields.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No additional parameters added yet
                                    </p>
                                )}
                            </div>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
