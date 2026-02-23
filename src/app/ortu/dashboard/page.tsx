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
            PENDING: { label: "⏳ Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
            APPROVED: { label: "✅ Disetujui", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            REJECTED: { label: "❌ Ditolak", cls: "bg-red-100 text-red-700 border-red-200" },
        };
        const s = map[status];
        return s ? <Badge className={s.cls}>{s.label}</Badge> : null;
    };

    const attBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            HADIR: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700" },
            IZIN: { label: "Izin", cls: "bg-amber-100 text-amber-700" },
            SAKIT: { label: "Sakit", cls: "bg-blue-100 text-blue-700" },
            ALPHA: { label: "Alpha", cls: "bg-red-100 text-red-700" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-100 text-orange-700" },
        };
        const s = map[status] || { label: status, cls: "bg-slate-500/20 text-slate-400" };
        return <Badge className={s.cls}>{s.label}</Badge>;
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
                    Halo, {currentUser.name} 👋
                </h1>
                <p className="text-slate-500 font-medium mt-1">
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
                    <Card key={child.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <GraduationCap className="w-7 h-7 text-[#000080]" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{child.name}</p>
                                    <p className="text-sm font-medium text-slate-500">NIS: {child.nis} • Kelas {child.className}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/ortu/izin">
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white shadow-sm border border-emerald-100">
                                <FileText className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                                    Ajukan Izin / Sakit
                                </p>
                                <p className="text-sm font-medium text-emerald-700/80">Kirim surat izin presensi anak</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/ortu/riwayat">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 hover:border-blue-300 transition-all cursor-pointer group shadow-sm">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white shadow-sm border border-blue-100">
                                <ClipboardCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                                    Riwayat Presensi
                                </p>
                                <p className="text-sm font-medium text-blue-700/80">Lihat histori absensi harian</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Attendance */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-bold">Presensi Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                        {children.flatMap((child) =>
                            getAttendanceByStudent(child.id).slice(0, 5).map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{att.subjectName}</p>
                                        <p className="text-xs font-medium text-slate-500">
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
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center justify-between gap-2">
                            Riwayat Pengajuan Izin
                            {pendingCount > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 shadow-sm">{pendingCount} pending</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                        {leaveRequests.slice(0, 5).map((lr) => (
                            <div
                                key={lr.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"} — {lr.studentName}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500">
                                        {new Date(lr.startDate).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short"
                                        })}
                                        {lr.startDate !== lr.endDate && ` - ${new Date(lr.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                                        <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold border 
                                            {lr.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            lr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            'bg-red-50 text-red-600 border-red-200'}">
                                            {lr.status === 'PENDING' ? '⏳ PENDING' : lr.status === 'APPROVED' ? '✅ DISETUJUI' : '❌ DITOLAK'}
                                        </span>
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
