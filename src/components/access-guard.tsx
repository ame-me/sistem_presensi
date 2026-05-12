"use client";

import { useAppStore } from "@/lib/store";
import { canAccessPage, getDefaultAccessiblePath } from "@/lib/access-control";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AccessGuard({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const accessMatrix = useAppStore((s) => s.accessMatrix);
    const accessMatrixLoaded = useAppStore((s) => s.accessMatrixLoaded);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!accessMatrixLoaded) return;

        if (!currentUser) {
            router.replace("/login");
            return;
        }

        if (!canAccessPage(currentUser, pathname, accessMatrix)) {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
        }
    }, [currentUser, accessMatrix, accessMatrixLoaded, pathname, router]);

    if (!accessMatrixLoaded || !currentUser || !canAccessPage(currentUser, pathname, accessMatrix)) return null;

    return <>{children}</>;
}
