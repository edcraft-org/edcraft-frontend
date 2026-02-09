import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthButton } from "./AuthButton";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ROUTES } from "@/router/paths";
import { FileQuestion, LayoutTemplate } from "lucide-react";

export function Header() {
    return (
        <header className="border-b bg-background">
            <div className="flex h-14 items-center px-4 gap-4">
                <Link to={ROUTES.HOME} className="flex items-center gap-2 font-semibold">
                    <span className="text-lg">EdCraft</span>
                </Link>

                <nav className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={ROUTES.QUESTION_BUILDER}>
                            <FileQuestion className="h-4 w-4 mr-2" />
                            Question Builder
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={ROUTES.TEMPLATE_BUILDER}>
                            <LayoutTemplate className="h-4 w-4 mr-2" />
                            Template Builder
                        </Link>
                    </Button>
                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                <AuthButton />
            </div>
            <AuthDialog />
        </header>
    );
}
