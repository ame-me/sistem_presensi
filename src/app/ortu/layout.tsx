"use client";

import { useAppStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { AccessModeBoundary } from "@/components/access-mode-boundary";
import { canAccessPage, getDefaultAccessiblePath, getPageAccessLevel, requiresTahunAjaran } from "@/lib/access-control";

export default function OrtuLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
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

        if (requiresTahunAjaran(currentUser, pathname) && !selectedTahunAjaran) {
            router.replace("/select-year");
            return;
        }
    }, [currentUser, accessMatrix, accessMatrixLoaded, selectedTahunAjaran, router, pathname]);

    if (!accessMatrixLoaded || !currentUser || !canAccessPage(currentUser, pathname, accessMatrix)) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Sidebar role="ORTU" userName={currentUser.name} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">
                    <AccessModeBoundary accessLevel={accessLevel}>{children}</AccessModeBoundary>
                </div>
            </main>
        </div>
    );
}
