import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { initAuth } from "@/features/auth/services/auth.service";
import { useUserStore } from "@/shared/stores/user.store";

export function MainLayout() {
    const { pathname } = useLocation();
    const user = useUserStore((s) => s.user);

    useEffect(() => {
        initAuth();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {user && <Sidebar />}
                <main className="flex-1 overflow-auto">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
            <Toaster position="bottom-right" />
        </div>
    );
}
