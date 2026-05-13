"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function GuruLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const router = useRouter();

    useEffect(() => {
        const isTeacher = currentUser && (
            currentUser.role.includes("GURU") || 
            currentUser.role.includes("WALI") || 
            currentUser.role.includes("KELAS")
        );

        if (!currentUser || !isTeacher) {
            router.replace("/login");
            return;
        }

        if (!selectedTahunAjaran) {
            router.replace("/select-year");
            return;
        }
    }, [currentUser, router]);

    const isTeacher = currentUser && (
        currentUser.role.includes("GURU") || 
        currentUser.role.includes("WALI") || 
        currentUser.role.includes("KELAS")
    );

    if (!currentUser || !isTeacher) return null;

    return (
        <div className="min-h-screen bg-background text-slate-800">
            <Sidebar role="GURU" userName={currentUser.name} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
