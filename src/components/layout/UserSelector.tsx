import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/shared/stores/user.store";
import { api } from "@/api/client";
import { queryKeys } from "@/api";
import type { UserSummaryResponse, CreateUserRequest, UserResponse } from "@/api/models";
import { getUserRootFolder } from "@/features/folders/folder.service";
import { UserPlus, User as UserIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// Schema for user creation form
const createUserSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required")
        .min(3, "Username must be at least 3 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function UserSelector() {
    const { user, setUser, setRootFolderId } = useUserStore();
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isFetchingRootFolder, setIsFetchingRootFolder] = useState(false);

    // Form setup
    const form = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: "",
            email: "",
        },
    });

    // Fetch all users
    const { data: users = [], isLoading } = useQuery<UserSummaryResponse[]>({
        queryKey: queryKeys.users.all,
        queryFn: async () => {
            const response = await api.listUsersUsersGet();
            return response.data;
        },
    });

    // Fetch root folder for selected user
    const fetchRootFolder = useCallback(
        async (userId: string) => {
            setIsFetchingRootFolder(true);
            try {
                const rootFolder = await getUserRootFolder(userId);
                setRootFolderId(rootFolder.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to fetch root folder: ${errorMessage}`);
            } finally {
                setIsFetchingRootFolder(false);
            }
        },
        [setRootFolderId],
    );

    const handleUserChange = useCallback(
        async (userId: string) => {
            if (!userId) return;

            try {
                const response = await api.getUserUsersUserIdGet(userId);
                const fullUser = response.data;
                setUser(fullUser);
                await fetchRootFolder(fullUser.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to load user: ${errorMessage}`);
            }
        },
        [setUser, fetchRootFolder],
    );

    // Auto-select first user if none selected
    useEffect(() => {
        if (!user && users.length > 0 && !isLoading) {
            handleUserChange(users[0].id);
        }
    }, [user, users, isLoading, handleUserChange]);

    // Create user mutation
    const createUserMutation = useMutation<UserResponse, Error, CreateUserRequest>({
        mutationFn: async (data: CreateUserRequest) => {
            const response = await api.createUserUsersPost(data);
            return response.data;
        },
        onSuccess: async (newUser) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
            setUser(newUser);
            setIsCreateDialogOpen(false);
            form.reset();
            toast.success("User created successfully");
            await fetchRootFolder(newUser.id);
        },
        onError: (error) => {
            toast.error(`Failed to create user: ${error.message}`);
        },
    });

    const handleCreateUser = (values: CreateUserFormValues) => {
        createUserMutation.mutate(values);
    };

    return (
        <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <Select
                value={user?.id}
                onValueChange={handleUserChange}
                disabled={isLoading || isFetchingRootFolder}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                    {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                            {u.username}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) {
                        form.reset();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Create new user">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Create a new user to manage your own folders and assessments.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
