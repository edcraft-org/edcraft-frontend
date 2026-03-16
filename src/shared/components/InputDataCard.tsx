import { useEffect, useRef, useMemo, useState, useCallback } from "react";
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
import { Database, Plus, Trash2, HelpCircle, Wand2, Loader2, Save } from "lucide-react";
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
import { toast } from "sonner";
import { ParamTypeConfig } from "./param-type-config";
import { useGenerateInputs } from "@/features/input-generator/useInputGenerator";

interface InputDataCardProps {
    onInputDataChange: (data: Record<string, unknown>) => void;
    onValidationChange?: (isValid: boolean) => void;
    entryFunctionParams?: EntryFunctionParams;
    title?: string;
    inputDataConfig?: Record<string, Record<string, unknown>>;
    onInputDataConfigChange?: (config: Record<string, Record<string, unknown>>) => void;
    onSave?: () => void;
    isSaving?: boolean;
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
    inputDataConfig,
    onInputDataConfigChange,
    onSave,
    isSaving,
}: InputDataCardProps) {
    const generateInputs = useGenerateInputs();

    // Per-parameter type + schema config state
    const [paramConfigs, setParamConfigs] = useState<Record<string, Record<string, unknown>>>(
        inputDataConfig ?? {},
    );

    // Track which individual params are currently generating
    const [generatingParam, setGeneratingParam] = useState<string | null>(null);
    const [generatingAll, setGeneratingAll] = useState(false);

    // Sync paramConfigs when inputDataConfig prop changes
    const inputDataConfigRef = useRef<string>("");
    useEffect(() => {
        const next = JSON.stringify(inputDataConfig ?? {});
        if (next !== inputDataConfigRef.current) {
            inputDataConfigRef.current = next;
            setParamConfigs(inputDataConfig ?? {});
        }
    }, [inputDataConfig]);

    const updateParamConfig = useCallback(
        (paramName: string, config: Record<string, unknown>) => {
            setParamConfigs((prev) => {
                const next =
                    Object.keys(config).length === 0
                        ? (() => {
                              const { [paramName]: _, ...rest } = prev;
                              return rest;
                          })()
                        : { ...prev, [paramName]: config };
                onInputDataConfigChange?.(next);
                return next;
            });
        },
        [onInputDataConfigChange],
    );

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

    const previousDataRef = useRef<string>("");
    const previousValidRef = useRef<boolean>(true);
    const previousParamsRef = useRef<string>(JSON.stringify(fixedParamNames));

    // Reset form when parameters change
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

    /** Populate a single field with a generated value */
    const setGeneratedValue = useCallback(
        (paramName: string, value: unknown) => {
            const serialized = typeof value === "string" ? value : JSON.stringify(value);
            internalForm.setValue(`fixedParams.${paramName}`, serialized, {
                shouldValidate: true,
                shouldDirty: true,
            });
        },
        [internalForm],
    );

    /** Generate value for a single parameter */
    const handleGenerateOne = (paramName: string) => {
        const config = paramConfigs[paramName];
        if (!config || !config.type) {
            toast.error(`Select a type for "${paramName}" first`);
            return;
        }
        setGeneratingParam(paramName);
        generateInputs.mutate(
            { [paramName]: config },
            {
                onSuccess: (data) => {
                    const val = data.inputs[paramName];
                    setGeneratedValue(paramName, val);
                    toast.success(`Generated value for "${paramName}"`);
                },
                onError: (err) => {
                    toast.error(`Generation failed: ${err.message}`);
                },
                onSettled: () => setGeneratingParam(null),
            },
        );
    };

    /** Generate values for all parameters that have a type config */
    const handleGenerateAll = () => {
        const configuredParams = fixedParamNames.filter(
            (p) => paramConfigs[p] && paramConfigs[p].type,
        );
        if (configuredParams.length === 0) {
            toast.error("No parameters have a type configured");
            return;
        }
        const inputs = Object.fromEntries(configuredParams.map((p) => [p, paramConfigs[p]]));
        setGeneratingAll(true);
        generateInputs.mutate(inputs, {
            onSuccess: (data) => {
                configuredParams.forEach((paramName) => {
                    const val = data.inputs[paramName];
                    if (val !== undefined) setGeneratedValue(paramName, val);
                });
                toast.success(`Generated values for ${configuredParams.length} parameter(s)`);
            },
            onError: (err) => {
                toast.error(`Generation failed: ${err.message}`);
            },
            onSettled: () => setGeneratingAll(false),
        });
    };

    const hasConfiguredParams = fixedParamNames.some(
        (p) => paramConfigs[p] && paramConfigs[p].type,
    );

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
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {title}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-sm font-medium mb-1">Manual input</p>
                                    <p className="text-sm">
                                        Enter values as JSON:
                                        <br />• Arrays: <code>[1, 2, 3]</code>
                                        <br />• Strings: <code>&quot;hello&quot;</code>
                                        <br />• Numbers: <code>42</code>
                                        <br />• Booleans: <code>true</code> / <code>false</code>
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Wand2 className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-sm font-medium mb-1">Input generator</p>
                                    <p className="text-sm">
                                        Select a type for each parameter and configure optional
                                        constraints. Click <strong>Generate</strong> next to a param
                                        or <strong>Generate All</strong> to auto-fill all typed
                                        parameters. You can also type values manually.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        {onSave && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1.5"
                                onClick={onSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Save className="h-3 w-3" />
                                )}
                                Save Config
                            </Button>
                        )}
                        {/* Generate All button — only visible when at least one param has a type */}
                        {hasConfiguredParams && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1.5"
                                onClick={handleGenerateAll}
                                disabled={generatingAll || generatingParam !== null}
                            >
                                {generatingAll ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Wand2 className="h-3 w-3" />
                                )}
                                Generate All
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...internalForm}>
                    <form className="space-y-4">
                        {/* Fixed Parameters Section */}
                        {fixedParamNames.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Fixed Parameters</h4>
                                <div className="bg-muted/30 p-3 rounded-md space-y-3">
                                    {fixedParamNames.map((paramName) => (
                                        <div key={paramName} className="space-y-1.5">
                                            {/* Value input row */}
                                            <FormField
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
                                            {/* Type config + generate row */}
                                            <div className="flex items-center gap-2 ml-[132px]">
                                                <ParamTypeConfig
                                                    paramName={paramName}
                                                    config={paramConfigs[paramName] ?? {}}
                                                    onChange={(cfg) =>
                                                        updateParamConfig(paramName, cfg)
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => handleGenerateOne(paramName)}
                                                    disabled={
                                                        generatingParam === paramName ||
                                                        generatingAll
                                                    }
                                                    title={`Generate value for ${paramName}`}
                                                >
                                                    {generatingParam === paramName ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Wand2 className="h-3 w-3" />
                                                    )}
                                                    Generate
                                                </Button>
                                            </div>
                                        </div>
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
