"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardList,
    FileText,
    Users,
    BookOpen,
    School,
    Settings,
    LogOut,
    GraduationCap,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    role: "ADMIN" | "GURU" | "ORTU";
    userName: string;
}

const navItems: Record<string, NavItem[]> = {
    ADMIN: [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Kelas", href: "/admin/kelas", icon: <School className="w-5 h-5" /> },
        { label: "Mata Pelajaran", href: "/admin/mapel", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Guru", href: "/admin/guru", icon: <Users className="w-5 h-5" /> },
        { label: "Siswa", href: "/admin/siswa", icon: <GraduationCap className="w-5 h-5" /> },
        { label: "Pengaturan", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    ],
    GURU: [
        { label: "Dashboard", href: "/guru/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Presensi", href: "/guru/presensi", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Pengajuan Izin", href: "/guru/izin", icon: <FileText className="w-5 h-5" /> },
    ],
    ORTU: [
        { label: "Dashboard", href: "/ortu/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Ajukan Izin", href: "/ortu/izin", icon: <FileText className="w-5 h-5" /> },
        { label: "Riwayat Presensi", href: "/ortu/riwayat", icon: <ClipboardList className="w-5 h-5" /> },
    ],
};

const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    GURU: "Portal Guru",
    ORTU: "Portal Orang Tua",
};

const roleColors: Record<string, string> = {
    ADMIN: "bg-[#000080] shadow-blue-900/10",
    GURU: "bg-[#000080] shadow-blue-900/10",
    ORTU: "bg-[#000080] shadow-blue-900/10",
};

export function Sidebar({ role, userName }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAppStore((s) => s.logout);
    const items = navItems[role] || [];
    const [mobileOpen, setMobileOpen] = useState(false);

    function handleLogout() {
        logout();
        router.push("/login");
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#000080] text-white shadow-lg"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#E2E8F0] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-[#F1F5F9]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
                                    roleColors[role]
                                )}
                            >
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-extrabold text-[#000080] tracking-tight">SIPANDU</h1>
                                <p className="text-[10px] font-bold text-slate-500 truncate max-w-[140px]">SMPK SANTA MARIA 2</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent",
                                    isActive
                                        ? "bg-[#000080] text-white shadow-md shadow-blue-900/10"
                                        : "text-slate-600 hover:text-[#000080] hover:bg-slate-50 hover:border-slate-200"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-[#F1F5F9] bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-[#000080] flex items-center justify-center text-sm font-bold text-white shadow-sm">
                            {userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase">{roleLabels[role]}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                    </Button>
                </div>
            </aside>
        </>
    );
}
