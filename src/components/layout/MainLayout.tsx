import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

export function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
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
