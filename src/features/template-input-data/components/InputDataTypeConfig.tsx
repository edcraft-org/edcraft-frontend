/**
 * ParamTypeConfig - Type selector and config popover for a single parameter.
 */

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, Plus, Trash2 } from "lucide-react";
import { PARAM_TYPES, FAKER_PROVIDERS, GRAPH_OUTPUT_FORMATS } from "../types/param-type";
import type { ParamType } from "../types/param-type";

const NONE = "__none__";

interface InputDataTypeConfigProps {
    paramName: string;
    config: Record<string, unknown>;
    onChange: (config: Record<string, unknown>) => void;
}

/**
 * Text input that holds local state while typing and only commits to parent on blur.
 */
function ConfigInput({
    value,
    onCommit,
    ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
    value: string;
    onCommit: (value: string) => void;
}) {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);
    return (
        <Input
            {...props}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => onCommit(local)}
            onKeyDown={(e) => {
                if (e.key === "Enter") onCommit(local);
            }}
        />
    );
}

// Simple field components
function NumberField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: unknown;
    onChange: (v: number | undefined) => void;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
                type="number"
                className="h-7 text-xs"
                value={value !== undefined && value !== null ? String(value) : ""}
                onChange={(e) => {
                    const val = e.target.value;
                    onChange(val === "" ? undefined : Number(val));
                }}
                placeholder="None"
            />
        </div>
    );
}

function CheckField({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <Checkbox
                id={label}
                checked={checked}
                onCheckedChange={(val) => onChange(Boolean(val))}
            />
            <Label htmlFor={label} className="text-xs cursor-pointer">
                {label}
            </Label>
        </div>
    );
}

/** Recursive nested schema config */
function NestedSchemaConfig({
    schema,
    onChange,
}: {
    schema: Record<string, unknown>;
    onChange: (schema: Record<string, unknown>) => void;
}) {
    const type = (schema.type as ParamType | undefined) ?? undefined;

    const handleTypeChange = (v: string) => {
        if (v === NONE) {
            onChange({});
        } else if (v === "string") {
            onChange({ type: v, pattern: "^[a-zA-Z0-9 ]+$" });
        } else {
            onChange({ type: v });
        }
    };

    return (
        <div className="space-y-2 border-l-2 border-muted pl-3">
            <Select value={type ?? NONE} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE} className="text-xs">
                        No type
                    </SelectItem>
                    {PARAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {type && <AdvancedConfigContent config={schema} onChange={onChange} />}
        </div>
    );
}

/** Main advanced config content rendered inside the popover */
function AdvancedConfigContent({
    config,
    onChange,
}: {
    config: Record<string, unknown>;
    onChange: (config: Record<string, unknown>) => void;
}) {
    const type = config.type as ParamType | undefined;
    const set = (key: string, val: unknown) => {
        if (val === undefined || val === null || val === "") {
            const { [key]: _, ...rest } = config;
            onChange(rest);
        } else {
            onChange({ ...config, [key]: val });
        }
    };

    if (!type) {
        return <p className="text-xs text-muted-foreground">Select a type to configure options.</p>;
    }

    if (type === "integer" || type === "number") {
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <NumberField
                        label="Minimum"
                        value={config.minimum}
                        onChange={(v) => set("minimum", v)}
                    />
                    <NumberField
                        label="Maximum"
                        value={config.maximum}
                        onChange={(v) => set("maximum", v)}
                    />
                </div>
            </div>
        );
    }

    if (type === "string") {
        const enumVals = (config.enum as string[] | undefined) ?? [];
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <NumberField
                        label="Min length"
                        value={config.minLength}
                        onChange={(v) => set("minLength", v)}
                    />
                    <NumberField
                        label="Max length"
                        value={config.maxLength}
                        onChange={(v) => set("maxLength", v)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Pattern</Label>
                    <ConfigInput
                        className="h-7 text-xs font-mono"
                        value={(config.pattern as string) ?? ""}
                        onCommit={(v) => set("pattern", v)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Faker provider</Label>
                    <Select
                        value={(config.faker as string) || NONE}
                        onValueChange={(v) => set("faker", v === NONE ? undefined : v)}
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE} className="text-xs">
                                None
                            </SelectItem>
                            {FAKER_PROVIDERS.map((p) => (
                                <SelectItem key={p.value} value={p.value} className="text-xs">
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Enum values (comma-separated)</Label>
                    <ConfigInput
                        className="h-7 text-xs"
                        placeholder='e.g. "red","green","blue"'
                        value={enumVals.join(",")}
                        onCommit={(raw) => {
                            if (!raw.trim()) {
                                set("enum", undefined);
                            } else {
                                set(
                                    "enum",
                                    raw
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                );
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    if (type === "boolean") {
        return <p className="text-xs text-muted-foreground italic">No options for boolean type.</p>;
    }

    if (type === "array" || type === "set") {
        const items = (config.items as Record<string, unknown> | undefined) ?? {};
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <NumberField
                        label="Min items"
                        value={config.minItems}
                        onChange={(v) => set("minItems", v)}
                    />
                    <NumberField
                        label="Max items"
                        value={config.maxItems}
                        onChange={(v) => set("maxItems", v)}
                    />
                </div>
                {type === "array" && (
                    <div className="grid grid-cols-2 gap-2">
                        <CheckField
                            label="Unique"
                            checked={Boolean(config.unique)}
                            onChange={(v) => set("unique", v || undefined)}
                        />
                        <CheckField
                            label="Sorted"
                            checked={Boolean(config.sorted)}
                            onChange={(v) => set("sorted", v || undefined)}
                        />
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs font-medium">Items schema</Label>
                    <NestedSchemaConfig
                        schema={items}
                        onChange={(updated) =>
                            set("items", Object.keys(updated).length ? updated : undefined)
                        }
                    />
                </div>
            </div>
        );
    }

    if (type === "tuple") {
        const prefixItems = (config.prefixItems as Record<string, unknown>[] | undefined) ?? [];
        const updateElement = (idx: number, updated: Record<string, unknown>) => {
            const next = prefixItems.map((item, i) => (i === idx ? updated : item));
            set("prefixItems", next);
        };
        const addElement = () => set("prefixItems", [...prefixItems, {}]);
        const removeElement = (idx: number) =>
            set(
                "prefixItems",
                prefixItems.filter((_, i) => i !== idx),
            );

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Elements ({prefixItems.length})</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={addElement}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                    </Button>
                </div>
                {prefixItems.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Item {idx + 1}</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => removeElement(idx)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <NestedSchemaConfig
                            schema={item}
                            onChange={(updated) => updateElement(idx, updated)}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (type === "object") {
        const properties =
            (config.properties as Record<string, Record<string, unknown>> | undefined) ?? {};
        const propEntries = Object.entries(properties);

        const setProp = (key: string, schema: Record<string, unknown>) => {
            set("properties", { ...properties, [key]: schema });
        };
        const removeProp = (key: string) => {
            const { [key]: _, ...rest } = properties;
            set("properties", Object.keys(rest).length ? rest : undefined);
        };
        const addProp = () => {
            const newKey = `prop${propEntries.length + 1}`;
            setProp(newKey, {});
        };
        const renameProp = (oldKey: string, newKey: string) => {
            const reordered = Object.fromEntries(
                propEntries.map(([k, v]) => [k === oldKey ? newKey : k, v]),
            );
            set("properties", reordered);
        };

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Properties</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={addProp}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                    </Button>
                </div>
                {propEntries.map(([key, schema], idx) => (
                    <div key={idx} className="border-l-2 border-muted pl-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <ConfigInput
                                className="h-7 text-xs flex-1 font-mono"
                                value={key}
                                onCommit={(v) => renameProp(key, v)}
                                placeholder="property_name"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => removeProp(key)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <NestedSchemaConfig
                            schema={schema}
                            onChange={(updated) => setProp(key, updated)}
                        />
                    </div>
                ))}
                {propEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                        No properties defined yet.
                    </p>
                )}
            </div>
        );
    }

    if (type === "graph") {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <NumberField
                        label="Min nodes"
                        value={config.min_nodes}
                        onChange={(v) => set("min_nodes", v)}
                    />
                    <NumberField
                        label="Max nodes"
                        value={config.max_nodes}
                        onChange={(v) => set("max_nodes", v)}
                    />
                    <NumberField
                        label="Min edges"
                        value={config.min_edges}
                        onChange={(v) => set("min_edges", v)}
                    />
                    <NumberField
                        label="Max edges"
                        value={config.max_edges}
                        onChange={(v) => set("max_edges", v)}
                    />
                    <NumberField
                        label="Weight min"
                        value={config.weight_min}
                        onChange={(v) => set("weight_min", v)}
                    />
                    <NumberField
                        label="Weight max"
                        value={config.weight_max}
                        onChange={(v) => set("weight_max", v)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <CheckField
                        label="Directed"
                        checked={Boolean(config.directed)}
                        onChange={(v) => set("directed", v || undefined)}
                    />
                    <CheckField
                        label="Weighted"
                        checked={Boolean(config.weighted)}
                        onChange={(v) => set("weighted", v || undefined)}
                    />
                    <CheckField
                        label="Connected"
                        checked={Boolean(config.connected)}
                        onChange={(v) => set("connected", v || undefined)}
                    />
                    <CheckField
                        label="Acyclic"
                        checked={Boolean(config.acyclic)}
                        onChange={(v) => set("acyclic", v || undefined)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium">Node schema</Label>
                    <NestedSchemaConfig
                        schema={(config.node_schema as Record<string, unknown> | undefined) ?? {}}
                        onChange={(updated) =>
                            set("node_schema", Object.keys(updated).length ? updated : undefined)
                        }
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Output format</Label>
                    <Select
                        value={(config.output_format as string) ?? "adjacency_list"}
                        onValueChange={(v) => set("output_format", v)}
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {GRAPH_OUTPUT_FORMATS.map((f) => (
                                <SelectItem key={f.value} value={f.value} className="text-xs">
                                    {f.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    return null;
}

export function InputDataTypeConfig({ paramName, config, onChange }: InputDataTypeConfigProps) {
    const type = (config.type as string) ?? "";

    // Ensure string type always has pattern initialized (even when loaded from saved config)
    useEffect(() => {
        if (type === "string" && config.pattern === undefined) {
            onChange({ ...config, pattern: "^[a-zA-Z0-9 ]+$" });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const handleTypeChange = (newType: string) => {
        if (!newType) {
            onChange({});
        } else if (newType === "string") {
            onChange({ type: newType, pattern: "^[a-zA-Z0-9 ]+$" });
        } else {
            // Keep type, clear other fields when type changes
            onChange({ type: newType });
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            {/* Type selector */}
            <Select
                value={type || NONE}
                onValueChange={(v) => handleTypeChange(v === NONE ? "" : v)}
            >
                <SelectTrigger className="h-7 text-xs w-[110px]">
                    <SelectValue placeholder="No type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE} className="text-xs">
                        No type
                    </SelectItem>
                    {PARAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Advanced config popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={`Advanced config for ${paramName}`}
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                    <div className="max-h-80 overflow-y-auto p-3 space-y-3">
                        <p className="text-xs font-medium">
                            Config: <span className="font-mono">{paramName}</span>
                        </p>
                        <AdvancedConfigContent config={config} onChange={onChange} />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
