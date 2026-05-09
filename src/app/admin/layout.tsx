"use client";

import { useAppStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "ADMIN_TU")) {
            router.replace("/login");
            return;
        }

        if (!selectedTahunAjaran) {
            router.replace("/select-year");
            return;
        }

        // Restriksi untuk Kepala Sekolah (Code 1)
        const isKepalaSekolah = currentUser.teacherCode === "1";
        const allowedPaths = ["/admin/dashboard", "/admin/guru", "/admin/ruangan", "/admin/mapel/analitik"];
        
        if (isKepalaSekolah && !allowedPaths.includes(pathname)) {
            router.replace("/admin/dashboard");
        }
    }, [currentUser, router, pathname]);

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "ADMIN_TU")) return null;

    return (
        <div className="min-h-screen bg-background text-slate-800">
            <Sidebar role={currentUser.role as any} userName={currentUser.name} teacherCode={currentUser.teacherCode} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
