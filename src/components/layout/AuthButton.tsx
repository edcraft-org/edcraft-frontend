import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, LogOut, Settings } from "lucide-react";
import { useUserStore } from "@/shared/stores/user.store";
import { useAuthDialogStore } from "@/shared/stores/auth-dialog.store";
import { logout } from "@/features/auth/services/auth.service";
import { CanvasSettingsDialog } from "@/features/canvas/components/CanvasSettingsDialog";

export function AuthButton() {
    const { user } = useUserStore();
    const { setOpen } = useAuthDialogStore();
    const navigate = useNavigate();
    const [showCanvasSettings, setShowCanvasSettings] = useState(false);

    if (!user) {
        return (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                Sign In
            </Button>
        );
    }

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Signed out");
            navigate("/");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span className="max-w-[160px] truncate">{user.name}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowCanvasSettings(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Canvas Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CanvasSettingsDialog
                open={showCanvasSettings}
                onOpenChange={setShowCanvasSettings}
            />
        </>
    );
}
