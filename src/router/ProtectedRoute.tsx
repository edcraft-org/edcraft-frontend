import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useUserStore } from "@/shared/stores/user.store";
import { useAuthDialogStore } from "@/shared/stores/auth-dialog.store";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";

export function ProtectedRoute() {
    const { user, isAuthChecked } = useUserStore();
    const { setOpen } = useAuthDialogStore();

    useEffect(() => {
        if (isAuthChecked && !user) {
            setOpen(true);
        }
    }, [isAuthChecked, user, setOpen]);

    if (!isAuthChecked) {
        return <PageSkeleton />;
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Please sign in to continue
            </div>
        );
    }

    return <Outlet />;
}
