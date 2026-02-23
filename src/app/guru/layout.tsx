"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function GuruLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const router = useRouter();

    useEffect(() => {
        if (!currentUser || currentUser.role !== "GURU") {
            router.replace("/login");
        }
    }, [currentUser, router]);

    if (!currentUser || currentUser.role !== "GURU") return null;

    return (
        <div className="min-h-screen bg-background text-slate-800">
            <Sidebar role="GURU" userName={currentUser.name} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
