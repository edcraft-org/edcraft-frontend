import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
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
import { login, signup } from "@/features/auth/auth.service";

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
    );
}

function SignupForm({ onSwitchMode }: { onSwitchMode: () => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: SignupFormValues) => {
        try {
            await signup(values.email, values.password);
            toast.success("Account created. Please sign in.");
            onSwitchMode();
        } catch {
            // Error toast already shown by axios interceptor if 4xx
        }
    };

    return (
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
            </form>
        </Form>
    );
}
