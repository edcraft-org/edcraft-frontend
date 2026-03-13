import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCanvasStore } from "@/shared/stores/canvas.store";

interface CanvasSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CanvasSettingsDialog({ open, onOpenChange }: CanvasSettingsDialogProps) {
    const { canvasBaseUrl, canvasAccessToken, setCredentials } = useCanvasStore();
    const [localBaseUrl, setLocalBaseUrl] = useState(canvasBaseUrl);
    const [localToken, setLocalToken] = useState(canvasAccessToken);
    const [showToken, setShowToken] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setLocalBaseUrl(canvasBaseUrl);
            setLocalToken(canvasAccessToken);
        }
        onOpenChange(nextOpen);
    };

    const handleSave = () => {
        const trimmedUrl = localBaseUrl
            .trim()
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");
        const trimmedToken = localToken.trim();
        if (!trimmedUrl || !trimmedToken) {
            toast.error("Both Canvas URL and access token are required.");
            return;
        }
        setCredentials(trimmedUrl, trimmedToken);
        toast.success("Canvas settings saved.");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Canvas Settings</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Connect to your Canvas LMS instance to upload questions and assessments directly
                    to your courses.
                </p>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="canvas-url">Canvas URL</Label>
                        <Input
                            id="canvas-url"
                            placeholder="myschool.instructure.com"
                            value={localBaseUrl}
                            onChange={(e) => setLocalBaseUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Your institution's Canvas domain, e.g.{" "}
                            <code>myschool.instructure.com</code>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="canvas-token">Access Token</Label>
                        <div className="relative">
                            <Input
                                id="canvas-token"
                                type={showToken ? "text" : "password"}
                                placeholder="Your Canvas personal access token"
                                value={localToken}
                                onChange={(e) => setLocalToken(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full w-10"
                                onClick={() => setShowToken(!showToken)}
                                aria-label={showToken ? "Hide token" : "Show token"}
                            >
                                {showToken ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Generate one in Canvas under Account → Settings → New Access Token.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
