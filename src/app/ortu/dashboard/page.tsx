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
    Loader2,
    Users,
    ArrowLeft,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData } from "@/hooks/useIzinData";
import { Button } from "@/components/ui/button";

export default function OrtuDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const { siswa: children, loading: loadingSiswa } = useSiswaData(undefined, undefined, currentUser?.nik);
    const { attendance: allAttendance } = useAttendanceData();
    const { izin: allIzin } = useIzinData();

    const selectedChildId = useAppStore((s) => s.selectedChildId);
    const setSelectedChildId = useAppStore((s) => s.setSelectedChildId);

    // Auto-select jika anak cuma 1 dan belum ada pilihan
    useEffect(() => {
        if (!loadingSiswa && children.length === 1 && !selectedChildId) {
            setSelectedChildId(children[0].id.toString());
        }
    }, [children, loadingSiswa, selectedChildId, setSelectedChildId]);

    if (!currentUser) return null;

    if (loadingSiswa) return (
        <div className="flex flex-col items-center justify-center p-10 h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#000080]" />
            <p className="text-[#000080] font-black uppercase tracking-widest text-xs animate-pulse">Menghubungkan Data Keluarga...</p>
        </div>
    );

    // Filter data berdasarkan anak yang dipilih (jika ada)
    const selectedChild = children.find(c => c.id.toString() === selectedChildId);
    
    // Jika belum pilih anak (dan anak > 1)
    if (!selectedChildId && children.length > 1) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 font-sans pb-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-[#000080] tracking-tight">Pilih Data Anak</h1>
                    <p className="text-slate-500 font-medium text-lg">Silakan pilih salah satu untuk melihat laporan presensi</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {children.map((child) => (
                        <Card 
                            key={child.id} 
                            className="bg-white border-2 border-slate-100 shadow-sm hover:border-[#000080] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => setSelectedChildId(child.id.toString())}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-[#000080] text-white p-2 rounded-full">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                            <CardContent className="pt-10 pb-8 px-8 text-center space-y-4">
                                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-10 h-10 text-[#000080]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-800">{child.name}</p>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">
                                        Kelas {child.cls} • NIS {child.nisn || child.noInduk}
                                    </p>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Lihat Laporan
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!selectedChildId && children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-[60vh] gap-4 text-center">
                <Users className="w-16 h-16 text-slate-300" />
                <h2 className="text-2xl font-black text-slate-400">Data Keluarga Tidak Ditemukan</h2>
                <p className="text-slate-400 max-w-sm">Maaf, tidak ada data siswa yang terhubung dengan NIK Anda. Silakan hubungi bagian IT/TU Sekolah.</p>
            </div>
        );
    }

    // MAIN DASHBOARD UI (Satu Anak Terpilih)
    const childrenIds = new Set([selectedChildId!]);
    const leaveRequests = allIzin.filter((l: any) => childrenIds.has(l.student_id?.toString()));
    const pendingCount = leaveRequests.filter((l: any) => l.status === "PENDING").length;
    const studentAttendance = allAttendance.filter((a: any) => childrenIds.has(a.student_id?.toString()));

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
            HADIR: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700 font-bold" },
            IZIN: { label: "Izin", cls: "bg-amber-100 text-amber-700 font-bold" },
            SAKIT: { label: "Sakit", cls: "bg-blue-100 text-blue-700 font-bold" },
            ALPHA: { label: "Alpha", cls: "bg-red-100 text-red-700 font-bold" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-100 text-orange-700 font-bold" },
        };
        const s = map[status] || { label: status, cls: "bg-slate-500/20 text-slate-400" };
        return <Badge className={s.cls}>{s.label}</Badge>;
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* Header dengan tombol Ganti Anak (jika lebih dari 1) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {children.length > 1 && (
                    <Button 
                        variant="outline" 
                        className="border-[#000080] text-[#000080] hover:bg-blue-50 font-bold rounded-xl"
                        onClick={() => setSelectedChildId(null)}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Ganti Data Anak
                    </Button>
                )}
            </div>

            {/* Selected Child Info Banner */}
            <Card className="bg-[#000080] border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-white/5 skew-x-[-12deg] translate-x-1/2" />
                <CardContent className="py-8 px-8 flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 p-1.5">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-white/70 font-bold uppercase tracking-widest text-[10px]">Data Anak Sedang Ditampilkan</p>
                        <p className="text-2xl font-black text-white">{selectedChild?.name}</p>
                        <p className="text-white/60 text-sm font-medium">Kelas {selectedChild?.cls} • NIS {selectedChild?.nisn || selectedChild?.noInduk}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/ortu/jadwal">
                    <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm rounded-2xl">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white shadow-sm border border-indigo-100">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">
                                    Jadwal Pelajaran
                                </p>
                                <p className="text-sm font-medium text-indigo-700/80">Jadwal mingguan siswa</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/ortu/izin">
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm rounded-2xl">
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white shadow-sm border border-emerald-100">
                                <FileText className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                                    Ajukan Izin / Sakit
                                </p>
                                <p className="text-sm font-medium text-emerald-700/80">Kirim surat izin presensi</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/ortu/riwayat">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 hover:border-blue-300 transition-all cursor-pointer group shadow-sm rounded-2xl">
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
                        <CardTitle className="text-[#000080] text-lg font-black uppercase tracking-tight">Presensi Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                        {studentAttendance.slice(0, 5).map((att: any) => (
                            <div
                                key={att.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors shadow-sm"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{att.subject_name}</p>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {new Date(att.date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                                    </p>
                                </div>
                                {attBadge(att.status)}
                            </div>
                        ))}
                        {studentAttendance.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4 italic">Belum ada data presensi untuk anak ini</p>
                        )}
                    </CardContent>
                </Card>

                {/* Leave Requests */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-black flex items-center justify-between gap-2 uppercase tracking-tight">
                            Status Izin
                            {pendingCount > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 shadow-sm">{pendingCount} pending</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                        {leaveRequests.slice(0, 5).map((lr: any) => (
                            <div
                                key={lr.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors shadow-sm"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500">
                                        {new Date(lr.start_date).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short"
                                        })}
                                        {lr.start_date !== lr.end_date && ` - ${new Date(lr.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                                    </p>
                                </div>
                                {statusBadge(lr.status)}
                            </div>
                        ))}
                        {leaveRequests.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4 italic">Belum ada pengajuan izin untuk anak ini</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
