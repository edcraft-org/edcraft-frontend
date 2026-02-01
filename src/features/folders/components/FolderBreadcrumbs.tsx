import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { FolderResponse } from "@/api/models";

interface FolderBreadcrumbsProps {
    path: FolderResponse[];
    onNavigate: (folderId: string) => void;
}

export function FolderBreadcrumbs({ path, onNavigate }: FolderBreadcrumbsProps) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {path.map((folder, index) => {
                    const isLast = index === path.length - 1;

                    return (
                        <BreadcrumbItem key={folder.id}>
                            {!isLast ? (
                                <>
                                    <BreadcrumbLink
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onNavigate(folder.id);
                                        }}
                                    >
                                        {folder.name}
                                    </BreadcrumbLink>
                                    <BreadcrumbSeparator />
                                </>
                            ) : (
                                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
