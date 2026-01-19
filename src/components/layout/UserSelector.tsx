import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/shared/stores/user.store";
import { apiClient, queryKeys } from "@/shared/services";
import type { User, CreateUserRequest } from "@/shared/types/common.types";
import { getUserRootFolder } from "@/features/folders/services/folder.service";
import { UserPlus, User as UserIcon } from "lucide-react";
import { useState } from "react";

export function UserSelector() {
  const { user, setUser, setRootFolderId } = useUserStore();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => apiClient.get<User[]>("/users"),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => apiClient.post<User>("/users", data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setUser(newUser);
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewEmail("");
      // Fetch root folder for new user
      fetchRootFolder(newUser.id);
    },
  });

  // Fetch root folder for selected user
  const fetchRootFolder = async (userId: string) => {
    try {
      const rootFolder = await getUserRootFolder(userId);
      setRootFolderId(rootFolder.id);
    } catch (error) {
      console.error("Failed to fetch root folder:", error);
      // Root folder should always exist - this indicates a serious error
    }
  };

  const handleUserChange = async (userId: string) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setUser(selectedUser);
      await fetchRootFolder(selectedUser.id);
    }
  };

  const handleCreateUser = () => {
    if (newUsername && newEmail) {
      createUserMutation.mutate({ username: newUsername, email: newEmail });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <UserIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={user?.id ?? ""} onValueChange={handleUserChange} disabled={isLoading}>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUsername || !newEmail || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
