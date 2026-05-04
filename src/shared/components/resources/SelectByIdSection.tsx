import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props<T> {
    label: string;
    placeholder: string;
    fetchById: (id: string) => Promise<T>;
    onSelect: (item: T) => void;
    errorMessage: string;
}

export function SelectByIdSection<T>({
    label,
    placeholder,
    fetchById,
    onSelect,
    errorMessage,
}: Props<T>) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = async () => {
        if (!input.trim()) return;

        setError(null);
        setLoading(true);

        try {
            const item = await fetchById(input.trim());
            onSelect(item);
        } catch {
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <div className="flex gap-2">
                <Input
                    placeholder={placeholder}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSelect()}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelect}
                    disabled={!input.trim() || loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select"}
                </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
