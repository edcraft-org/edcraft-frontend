import { Navigate } from "react-router-dom";
import { useUserStore } from "@/shared/stores/user.store";
import { PageSkeleton } from "@/shared/components/feedback/LoadingSkeleton";
import LandingPage from "@/features/landing/LandingPage";
import { ROUTES } from "./paths";

export default function HomeRoute() {
    const { user, rootFolderId, isAuthChecked } = useUserStore();

    if (!isAuthChecked) {
        return <PageSkeleton />;
    }

    if (user && rootFolderId) {
        return <Navigate to={ROUTES.FOLDER(rootFolderId)} replace />;
    }

    return <LandingPage />;
}
