"use client";

import { useAppStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { AccessModeBoundary } from "@/components/access-mode-boundary";
import { canAccessPage, getDefaultAccessiblePath, getPageAccessLevel } from "@/lib/access-control";

export default function AdminITLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const accessMatrix = useAppStore((s) => s.accessMatrix);
    const accessMatrixLoaded = useAppStore((s) => s.accessMatrixLoaded);
    const router = useRouter();
    const pathname = usePathname();
    const accessLevel = getPageAccessLevel(currentUser, pathname, accessMatrix);

    useEffect(() => {
        if (!accessMatrixLoaded) return;

        if (!currentUser) {
            router.replace("/login");
            return;
        }

        if (!canAccessPage(currentUser, pathname, accessMatrix)) {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
            return;
        }
    }, [currentUser, accessMatrix, accessMatrixLoaded, router, pathname]);

    if (!accessMatrixLoaded || !currentUser || !canAccessPage(currentUser, pathname, accessMatrix)) return null;

    return (
        <div className="min-h-screen bg-background text-slate-800">
            <Sidebar role="ADMIN_IT" userName={currentUser.name} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">
                    <AccessModeBoundary accessLevel={accessLevel}>{children}</AccessModeBoundary>
                </div>
            </main>
        </div>
    );
}
