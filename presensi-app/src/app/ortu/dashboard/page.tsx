"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    GraduationCap,
    FileText,
    ClipboardCheck,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function OrtuDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const getChildrenByParent = useAppStore((s) => s.getChildrenByParent);
    const getLeaveRequestsByParent = useAppStore((s) => s.getLeaveRequestsByParent);
    const getAttendanceByStudent = useAppStore((s) => s.getAttendanceByStudent);

    if (!currentUser) return null;

    const children = getChildrenByParent(currentUser.id);
    const leaveRequests = getLeaveRequestsByParent(currentUser.id);
    const pendingCount = leaveRequests.filter((l) => l.status === "PENDING").length;

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            PENDING: { label: "⏳ Pending", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
            APPROVED: { label: "✅ Disetujui", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
            REJECTED: { label: "❌ Ditolak", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
        };
        const s = map[status];
        return s ? <Badge className={s.cls}>{s.label}</Badge> : null;
    };

    const attBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            HADIR: { label: "Hadir", cls: "bg-emerald-500/20 text-emerald-400" },
            IZIN: { label: "Izin", cls: "bg-amber-500/20 text-amber-400" },
            SAKIT: { label: "Sakit", cls: "bg-blue-500/20 text-blue-400" },
            ALPHA: { label: "Alpha", cls: "bg-red-500/20 text-red-400" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-500/20 text-orange-400" },
        };
        const s = map[status] || { label: status, cls: "bg-slate-500/20 text-slate-400" };
        return <Badge className={s.cls}>{s.label}</Badge>;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Halo, {currentUser.name} 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    Portal Orang Tua •{" "}
                    {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Children Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                    <Card key={child.id} className="bg-slate-900/50 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                                    <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{child.name}</p>
                                    <p className="text-sm text-slate-400">NIS: {child.nis}</p>
                                    <p className="text-sm text-slate-400">{child.className}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/ortu/izin">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                                <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                    Ajukan Izin
                                </p>
                                <p className="text-sm text-slate-400">Izin atau sakit untuk anak Anda</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/ortu/riwayat">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <ClipboardCheck className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    Riwayat Presensi
                                </p>
                                <p className="text-sm text-slate-400">Lihat kehadiran anak Anda</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Attendance */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Presensi Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {children.flatMap((child) =>
                            getAttendanceByStudent(child.id).slice(0, 5).map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-white">{att.subjectName}</p>
                                        <p className="text-xs text-slate-500">
                                            {child.name} •{" "}
                                            {new Date(att.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                        </p>
                                    </div>
                                    {attBadge(att.status)}
                                </div>
                            ))
                        )}
                        {children.every((c) => getAttendanceByStudent(c.id).length === 0) && (
                            <p className="text-sm text-slate-500 text-center py-4">Belum ada data presensi</p>
                        )}
                    </CardContent>
                </Card>

                {/* Leave Requests */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-base flex items-center gap-2">
                            Pengajuan Izin
                            {pendingCount > 0 && (
                                <Badge className="bg-amber-500/20 text-amber-400 text-xs">{pendingCount} pending</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {leaveRequests.slice(0, 5).map((lr) => (
                            <div
                                key={lr.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                            >
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"} — {lr.studentName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(lr.leaveDate).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                {statusBadge(lr.status)}
                            </div>
                        ))}
                        {leaveRequests.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">Belum ada pengajuan izin</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
