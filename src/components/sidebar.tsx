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
    LogOut,
    GraduationCap,
    Menu,
    X,
    Activity,
    Shield,
    Database,
    CalendarDays,
    Settings,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_PAGES, canAccessPage, resolveAccessRole } from "@/lib/access-control";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    activePaths?: string[];
}

interface SidebarProps {
    role: "ADMIN" | "ADMIN_IT" | "GURU" | "ORTU" | "ADMIN_TU";
    userName: string;
    teacherCode?: string;
}

const pageIcons: Record<string, React.ReactNode> = {
    "/admin/dashboard": <LayoutDashboard className="w-5 h-5" />,
    "/admin/kelas": <School className="w-5 h-5" />,
    "/admin/ruangan": <LayoutDashboard className="w-5 h-5" />,
    "/admin/mapel": <BookOpen className="w-5 h-5" />,
    "/admin/mapel/analitik": <Activity className="w-5 h-5" />,
    "/admin/guru": <Users className="w-5 h-5" />,
    "/admin/siswa": <GraduationCap className="w-5 h-5" />,
    "/admin/ortu": <Users className="w-5 h-5" />,
    "/admin/tahun-ajaran": <CalendarDays className="w-5 h-5" />,
    "/admin/izin": <FileText className="w-5 h-5" />,
    "/admin/rekap": <ClipboardList className="w-5 h-5" />,
    "/admin/verifikasi": <Shield className="w-5 h-5" />,
    "/it/dashboard": <LayoutDashboard className="w-5 h-5" />,
    "/it/users": <Shield className="w-5 h-5" />,
    "/it/ortu": <Users className="w-5 h-5" />,
    "/it/backup": <Database className="w-5 h-5" />,
    "/guru/dashboard": <LayoutDashboard className="w-5 h-5" />,
    "/guru/presensi": <ClipboardList className="w-5 h-5" />,
    "/guru/izin": <FileText className="w-5 h-5" />,
    "/guru/wali-kelas": <GraduationCap className="w-5 h-5" />,
    "/ortu/dashboard": <LayoutDashboard className="w-5 h-5" />,
    "/ortu/jadwal": <BookOpen className="w-5 h-5" />,
    "/ortu/izin": <FileText className="w-5 h-5" />,
    "/ortu/riwayat": <ClipboardList className="w-5 h-5" />,
    "/admin/profile": <Settings className="w-5 h-5" />,
    "/guru/profile": <Settings className="w-5 h-5" />,
    "/ortu/profile": <Settings className="w-5 h-5" />,
    "/it/profile": <Settings className="w-5 h-5" />,
};

const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    KEPALA_SEKOLAH: "Kepala Sekolah",
    ADMIN_IT: "Admin IT Server",
    ADMIN_TU: "Admin Tata Usaha",
    GURU: "Portal Guru",
    ORTU: "Portal Orang Tua",
};

export function Sidebar({ role, userName }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const currentUser = useAppStore((s) => s.currentUser);
    const accessMatrix = useAppStore((s) => s.accessMatrix);
    const logout = useAppStore((s) => s.logout);
    const displayRole = resolveAccessRole(currentUser?.role) || role;

    const isWaliKelasPanel = pathname.startsWith("/guru/wali-kelas");
    const accessiblePages = APP_PAGES
        .filter((page) => canAccessPage(currentUser, page.path, accessMatrix))
        .map((page): NavItem => ({
            label: page.label,
            href: page.path,
            icon: pageIcons[page.path] || <LayoutDashboard className="w-5 h-5" />,
        }));
    const canAccessKelas = canAccessPage(currentUser, "/admin/kelas", accessMatrix);
    const canAccessRuangan = canAccessPage(currentUser, "/admin/ruangan", accessMatrix);
    const items = accessiblePages.reduce<NavItem[]>((acc, item) => {
        if (item.href === "/admin/ruangan") return acc;
        if (item.href === "/admin/kelas" && (canAccessKelas || canAccessRuangan)) {
            acc.push({
                label: "Daftar Kelas & Ruangan",
                href: canAccessKelas ? "/admin/kelas" : "/admin/ruangan",
                icon: <School className="w-5 h-5" />,
                activePaths: ["/admin/kelas", "/admin/ruangan"],
            });
            return acc;
        }
        acc.push(item);
        return acc;
    }, []);

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
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#000080] text-white shadow-lg print:hidden"
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
                                    "w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 p-0.5",
                                )}
                            >
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
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
                        const activePaths = item.activePaths || [item.href];
                        const isActive = activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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
                            <p className="text-[10px] font-medium text-slate-500 uppercase">
                                {isWaliKelasPanel ? "WALI KELAS " + (currentUser?.waliKelasRombelName || "") : roleLabels[displayRole]}
                            </p>
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
