"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useState } from "react";

export default function OrtuRiwayatPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const getChildrenByParent = useAppStore((s) => s.getChildrenByParent);
    const getAttendanceByStudent = useAppStore((s) => s.getAttendanceByStudent);
    const getLeaveRequestsByParent = useAppStore((s) => s.getLeaveRequestsByParent);

    const [activeTab, setActiveTab] = useState<"presensi" | "izin">("presensi");

    if (!currentUser) return null;

    const children = getChildrenByParent(currentUser.id);

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            HADIR: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            IZIN: { label: "Izin", cls: "bg-amber-100 text-amber-700 border-amber-200" },
            SAKIT: { label: "Sakit", cls: "bg-blue-100 text-blue-700 border-blue-200" },
            ALPHA: { label: "Alpha", cls: "bg-red-100 text-red-700 border-red-200" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-100 text-orange-700 border-orange-200" },
        };
        const s = map[status] || { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
        return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
    };

    return (
        <div className="space-y-6 pb-12 font-sans">
            <div className="flex items-center gap-4">
                <Link
                    href="/ortu/dashboard"
                    className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#000080] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080]">Riwayat Presensi</h1>
                    <p className="text-slate-500 font-medium mt-0.5">Pantau histori kehadiran harian anak Anda</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm">
                <button
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'presensi' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('presensi')}
                >
                    Kehadiran Harian
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'izin' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('izin')}
                >
                    Status Pengajuan Izin
                </button>
            </div>

            {activeTab === "presensi" && children.map((child) => {
                const records = getAttendanceByStudent(child.id);
                return (
                    <Card key={child.id} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-[#000080] text-xl font-bold">
                                {child.name} <span className="text-slate-400 font-medium text-base ml-2">NIS: {child.nis}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {records.length > 0 ? (
                                <div className="space-y-3">
                                    {records.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{att.subjectName}</p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Kelas {att.className} •{" "}
                                                    {new Date(att.date).toLocaleDateString("id-ID", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            {statusBadge(att.status)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    Belum ada data presensi. Guru belum menginput presensi.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {activeTab === "izin" && (
                <div className="space-y-4">
                    {getLeaveRequestsByParent(currentUser.id).length > 0 ? (
                        getLeaveRequestsByParent(currentUser.id).map((lr) => (
                            <Card key={lr.id} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={lr.type === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                                                    {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                                </Badge>
                                                <span className="text-sm font-bold text-slate-800">{lr.studentName}</span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500">
                                                {new Date(lr.startDate).toLocaleDateString("id-ID", { dateStyle: 'long' })}
                                                {lr.startDate !== lr.endDate && ` s/d ${new Date(lr.endDate).toLocaleDateString("id-ID", { dateStyle: 'long' })}`}
                                            </p>
                                        </div>
                                        <Badge className={`px-3 py-1 text-xs font-bold shadow-sm ${lr.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                                lr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                    'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}>
                                            {lr.status === 'PENDING' ? '⏳ Menunggu Validasi' : lr.status === 'APPROVED' ? '✅ Disetujui' : '❌ Ditolak'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-500 text-xs uppercase tracking-wider block mb-1">Pesan:</span>
                                        {lr.reason}
                                    </div>
                                    {lr.reviewNotes && (
                                        <div className={`text-sm p-3 rounded-xl border ${lr.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                            <span className="font-bold text-xs uppercase tracking-wider block mb-1">Pesan dari Guru ({lr.reviewedBy}):</span>
                                            {lr.reviewNotes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                            belum ada riwayat pengajuan izin
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
