import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthDialogStore } from "@/shared/stores/auth-dialog.store";
import { login, signup, resendVerification } from "@/features/auth/auth.service";
import { OAuthButtons } from "./OAuthButtons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z
        .string()
        .min(12, "Password must be at least 12 characters")
        .max(128, "Password must be at most 128 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthDialog() {
    const { open, setOpen } = useAuthDialogStore();
    const [mode, setMode] = useState<"login" | "signup">("login");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{mode === "login" ? "Sign In" : "Create Account"}</DialogTitle>
                </DialogHeader>

                {mode === "login" ? (
                    <LoginForm
                        onClose={() => setOpen(false)}
                        onSwitchMode={() => setMode("signup")}
                    />
                ) : (
                    <SignupForm onSwitchMode={() => setMode("login")} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function LoginForm({ onClose, onSwitchMode }: { onClose: () => void; onSwitchMode: () => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await login(values.email, values.password);
            toast.success("Signed in successfully");
            onClose();
        } catch {
            // Error toast already shown by axios interceptor if 4xx
        }
    };

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchMode}
                            className="underline hover:text-foreground"
                        >
                            Register
                        </button>
                    </p>
                </form>
            </Form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
            </div>

            <OAuthButtons onOAuthStart={onClose} />
        </div>
    );
}

function SignupForm({ onSwitchMode }: { onSwitchMode: () => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const [signupEmail, setSignupEmail] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: SignupFormValues) => {
        try {
            await signup(values.email, values.password);
            setSignupEmail(values.email);
            toast.success("Account created successfully!");
        } catch {
            // Error toast already shown by axios interceptor if 4xx
        }
    };

    const handleResend = async () => {
        if (!signupEmail) return;

        setIsResending(true);
        try {
            await resendVerification(signupEmail);
            toast.success("Verification email sent! Please check your inbox.");
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ||
                err?.message ||
                "Failed to resend verification email";
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    // Show verification message after successful signup
    if (signupEmail) {
        return (
            <div className="space-y-4">
                <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Verify Your Email</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>
                            We've sent a verification email to <strong>{signupEmail}</strong>.
                        </p>
                        <p className="text-sm">
                            Please check your inbox and click the verification link to activate your
                            account.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResend}
                                disabled={isResending}
                            >
                                {isResending ? "Sending..." : "Resend Email"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={onSwitchMode}>
                                Back to Sign In
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchMode}
                            className="underline hover:text-foreground"
                        >
                            Sign In
                        </button>
                    </p>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <OAuthButtons onOAuthStart={() => {}} />
                </form>
            </Form>
        </div>
    );
}
