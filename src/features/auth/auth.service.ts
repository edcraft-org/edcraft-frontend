import { api } from "@/api/client";
import { useUserStore } from "@/shared/stores/user.store";

async function fetchAndStoreUser() {
    const [userRes, folderRes] = await Promise.all([
        api.getUserUsersMeGet(),
        api.getUserRootFolderUsersMeRootFolderGet(),
    ]);
    const user = userRes.data;
    useUserStore.getState().setUser(user);
    useUserStore.getState().setRootFolderId(folderRes.data.id);
}

export async function login(email: string, password: string) {
    await api.loginAuthLoginPost({ email, password });
    await fetchAndStoreUser();
}

export async function signup(email: string, password: string) {
    await api.signupAuthSignupPost({ email, password });
}

export async function logout() {
    await api.logoutAuthLogoutPost();
    useUserStore.getState().logout();
}

export async function initAuth() {
    try {
        await fetchAndStoreUser();
    } catch (err) {
        // Not authenticated — leave store as-is (user: null)
        console.warn("Init auth failed:", err);
    } finally {
        useUserStore.getState().setIsAuthChecked(true);
    }
}
