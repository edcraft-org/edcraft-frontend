// QuestionTextTemplateCard - Card for defining an optional question text template (basic or mustache)

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

const CHIP_CLASSES =
    "inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium mx-0.5 select-none cursor-default";

function makeChip(varName: string): HTMLSpanElement {
    const chip = document.createElement("span");
    chip.dataset.var = varName;
    chip.contentEditable = "false";
    chip.className = CHIP_CLASSES;
    chip.textContent = varName;
    return chip;
}

/** Build editor DOM from text containing {var} tokens */
function buildEditorContent(el: HTMLDivElement, text: string) {
    el.innerHTML = "";
    const parts = text.split(/(\{[^}]+\})/);
    for (const part of parts) {
        const match = part.match(/^\{([^}]+)\}$/);
        if (match) {
            el.appendChild(makeChip(match[1]));
        } else if (part) {
            const lines = part.split("\n");
            lines.forEach((line, i) => {
                if (i > 0) el.appendChild(document.createElement("br"));
                if (line) el.appendChild(document.createTextNode(line));
            });
        }
    }
}

/** Serialise editor DOM back to text with {var} tokens */
function getValueFromEditor(el: HTMLDivElement): string {
    const parts: string[] = [];
    function walk(node: Node, isRoot: boolean) {
        if (node.nodeType === Node.TEXT_NODE) {
            parts.push(node.textContent ?? "");
        } else if (node instanceof HTMLElement) {
            if (node.dataset.var !== undefined) {
                parts.push(`{${node.dataset.var}}`);
            } else if (node.tagName === "BR") {
                parts.push("\n");
            } else {
                if (!isRoot && (node.tagName === "DIV" || node.tagName === "P")) {
                    parts.push("\n");
                }
                node.childNodes.forEach((child) => walk(child, false));
            }
        }
    }
    el.childNodes.forEach((child) => walk(child, true));
    // Trim trailing newlines that browsers may insert when clearing content
    return parts.join("").replace(/\n+$/, "");
}

interface QuestionTextTemplateCardProps {
    mode: "basic" | "mustache";
    value: string;
    availableVars: string[];
    entryFunction: string;
    error: string | null;
    onModeChange: (mode: "basic" | "mustache") => void;
    onValueChange: (value: string) => void;
}

export function QuestionTextTemplateCard({
    mode,
    value,
    availableVars,
    entryFunction,
    error,
    onModeChange,
    onValueChange,
}: QuestionTextTemplateCardProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [selectedVar, setSelectedVar] = useState("");
    // Save cursor position when editor loses focus so Insert still works
    const savedRange = useRef<Range | null>(null);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (getValueFromEditor(el) !== value) {
            buildEditorContent(el, value);
        }
    }, [value]);

    const handleInput = () => {
        const el = editorRef.current;
        if (!el) return;
        onValueChange(getValueFromEditor(el));
    };

    // When user closes a brace, check if they typed a complete {var} — if so, convert to chip.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "}") return;

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !sel.getRangeAt(0).collapsed) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) return;

        const textBefore = (node.textContent ?? "").slice(0, range.startOffset);
        const lastOpen = textBefore.lastIndexOf("{");
        if (lastOpen === -1) return;

        const varName = textBefore.slice(lastOpen + 1).trim();
        if (!varName) return;

        e.preventDefault();

        // Delete the `{varName` text and replace with chip
        const deleteRange = document.createRange();
        deleteRange.setStart(node, lastOpen);
        deleteRange.setEnd(node, range.startOffset);
        deleteRange.deleteContents();

        const chip = makeChip(varName);
        deleteRange.insertNode(chip);
        deleteRange.setStartAfter(chip);
        deleteRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(deleteRange);

        onValueChange(getValueFromEditor(editorRef.current!));
    };

    // On paste, convert any {var} patterns in the pasted text to chips inline.
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        range.deleteContents();

        const parts = text.split(/(\{[^}]+\})/);
        for (const part of parts) {
            const match = part.match(/^\{([^}]+)\}$/);
            if (match) {
                const chip = makeChip(match[1]);
                range.insertNode(chip);
                range.setStartAfter(chip);
            } else if (part) {
                const textNode = document.createTextNode(part);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
            }
        }

        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        onValueChange(getValueFromEditor(editorRef.current!));
    };

    const handleEditorBlur = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const handleInsertVar = () => {
        if (!selectedVar || !editorRef.current) return;
        const el = editorRef.current;
        el.focus();

        const sel = window.getSelection();
        let range: Range;

        if (savedRange.current) {
            range = savedRange.current.cloneRange();
            sel?.removeAllRanges();
            sel?.addRange(range);
            savedRange.current = null;
        } else if (sel && sel.rangeCount > 0) {
            range = sel.getRangeAt(0);
        } else {
            range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

        range.deleteContents();

        const chip = makeChip(selectedVar);
        range.insertNode(chip);
        range.setStartAfter(chip);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);

        onValueChange(getValueFromEditor(el));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    Step 4: Question Text Template{" "}
                    <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Mode toggle */}
                <div className="flex rounded-md border w-fit">
                    <Button
                        type="button"
                        variant={mode === "basic" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => onModeChange("basic")}
                    >
                        Basic
                    </Button>
                    <Button
                        type="button"
                        variant={mode === "mustache" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-l-none border-l"
                        onClick={() => onModeChange("mustache")}
                    >
                        Mustache
                    </Button>
                </div>

                {/* Basic mode: contenteditable with chip rendering */}
                {mode === "basic" && (
                    <div className="relative">
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            onBlur={handleEditorBlur}
                            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        {value === "" && (
                            <p className="pointer-events-none absolute left-3 top-2 text-sm font-mono text-muted-foreground">
                                Type your question. Use Insert to add variables.
                            </p>
                        )}
                    </div>
                )}

                {/* Mustache mode: plain textarea */}
                {mode === "mustache" && (
                    <Textarea
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder="Enter a Mustache template, e.g. What is {{result}} when called with {{nums}}?"
                        className="min-h-[80px] font-mono text-sm"
                    />
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                {/* Variable insertion (basic mode only) */}
                {mode === "basic" && (
                    <div className="flex gap-2 items-center">
                        <Select
                            value={selectedVar}
                            onValueChange={setSelectedVar}
                            disabled={availableVars.length === 0}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue
                                    placeholder={availableVars.length === 0 ? "No params" : "var"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {availableVars.map((v) => (
                                    <SelectItem key={v} value={v}>
                                        {v}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleInsertVar}
                            disabled={!selectedVar}
                        >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Insert
                        </Button>
                        {availableVars.length === 0 && entryFunction && (
                            <span className="text-xs text-muted-foreground">
                                No parameters found for{" "}
                                <span className="font-mono">{entryFunction}</span>
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
