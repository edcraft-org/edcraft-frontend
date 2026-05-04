import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, RefreshCw, ExternalLink, Unlink } from "lucide-react";

interface LinkMenuProps<T> {
    item: T;
    onSync: (item: T) => void;
    onGoToSource: (item: T) => void;
    onUnlink: (item: T) => void;
}

export function LinkMenu<T>({ item, onSync, onGoToSource, onUnlink }: LinkMenuProps<T>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-500 hover:text-blue-600"
                >
                    <Link2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onSync(item)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync from source
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGoToSource(item)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to source
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onUnlink(item)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
