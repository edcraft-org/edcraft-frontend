import { Button } from "@/components/ui/button";
import { initiateOAuth, type OAuthProvider } from "@/features/auth/oauth.service";
import { useLocation } from "react-router-dom";

interface OAuthButtonConfig {
    provider: OAuthProvider;
    label: string;
    variant?: "default" | "outline";
}

const oauthConfigs: OAuthButtonConfig[] = [
    {
        provider: "github",
        label: "Continue with GitHub",
        variant: "outline",
    },
    // Future providers can be added here:
    // {
    //   provider: "google",
    //   label: "Continue with Google",
    //   icon: GoogleIcon,
    //   variant: "outline",
    // },
];

interface OAuthButtonsProps {
    onOAuthStart?: () => void;
}

export function OAuthButtons({ onOAuthStart }: OAuthButtonsProps) {
    const location = useLocation();

    const handleOAuthClick = (provider: OAuthProvider) => {
        onOAuthStart?.();
        
        const currentPath = location.pathname + location.search;
        const redirectTo = currentPath.startsWith("/") ? currentPath : "/folders/root";
        initiateOAuth(provider, redirectTo);
    };

    return (
        <div className="space-y-3">
            {oauthConfigs.map(({ provider, label, variant }) => (
                <Button
                    key={provider}
                    type="button"
                    variant={variant}
                    className="w-full"
                    onClick={() => handleOAuthClick(provider)}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
}
