import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ReadableValue } from "./ReadableValue";

interface QuestionInputsProps {
    inputs: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

/**
 * Renders question inputs as a two-column table. Nested values still use the
 * readable list/key-value renderer so arrays and objects keep their shape.
 */
export function QuestionInputs({ inputs }: QuestionInputsProps) {
    if (!isPlainObject(inputs)) {
        return <ReadableValue value={inputs} inlineScalarArrays />;
    }

    const entries = Object.entries(inputs);
    if (entries.length === 0) {
        return <p className="text-sm text-muted-foreground">No inputs</p>;
    }

    return (
        <Table className="text-xs [&_td]:whitespace-normal [&_td]:align-top">
            <TableHeader>
                <TableRow>
                    <TableHead className="h-8 px-2">Input</TableHead>
                    <TableHead className="h-8 px-2">Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {entries.map(([key, value]) => (
                    <TableRow key={key}>
                        <TableCell className="px-2 font-mono text-xs">{key}</TableCell>
                        <TableCell className="px-2">
                            <ReadableValue value={value} inlineScalarArrays />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
