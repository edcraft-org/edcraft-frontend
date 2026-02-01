import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Database } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";

interface InputDataCardProps<T extends FieldValues = FieldValues> {
    control: Control<T>;
    onInputDataChange: (data: string) => void;
    title: string;
}

export function InputDataCard<T extends FieldValues = FieldValues>({
    control,
    onInputDataChange,
    title,
}: InputDataCardProps<T>) {
    const [jsonError, setJsonError] = useState<string | null>(null);

    const handleChange = (value: string) => {
        onInputDataChange(value);
        // Validate JSON on change
        if (value.trim()) {
            try {
                JSON.parse(value);
                setJsonError(null);
            } catch {
                setJsonError("Invalid JSON format");
            }
        } else {
            setJsonError(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <FormField
                    control={control}
                    name={"inputDataJson" as Path<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor="input-data">Input Data (JSON)</FormLabel>
                            <FormControl>
                                <Textarea
                                    id="input-data"
                                    placeholder='{"arr": [5, 2, 8, 1]}'
                                    className="font-mono text-sm min-h-[100px]"
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        handleChange(e.target.value);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
            </CardContent>
        </Card>
    );
}
