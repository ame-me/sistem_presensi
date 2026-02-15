"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const currentUser = useAppStore((s) => s.currentUser);
    const router = useRouter();

    useEffect(() => {
        if (!currentUser || currentUser.role !== "ADMIN") {
            router.replace("/login");
        }
    }, [currentUser, router]);

    if (!currentUser || currentUser.role !== "ADMIN") return null;

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar role="ADMIN" userName={currentUser.name} />
            <main className="lg:ml-64 min-h-screen">
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
