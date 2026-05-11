"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Eye, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData } from "@/hooks/useIzinData";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { getUploadUrl } from "@/lib/api-config";

export default function OrtuRiwayatPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const { siswa: children, loading: loadingSiswa } = useSiswaData(undefined, undefined, currentUser?.nik);
    const { attendance: allAttendance, loading: loadingAtt } = useAttendanceData();
    const { izin: allIzin, loading: loadingIzin } = useIzinData();

    const [activeTab, setActiveTab] = useState<"presensi" | "izin" | "rekap">("presensi");
    const globalSelectedId = useAppStore((s) => s.selectedChildId);
    const setGlobalSelectedId = useAppStore((s) => s.setSelectedChildId);
    const [selectedChildId, setSelectedChildId] = useState<string>(globalSelectedId || "all");
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

    // Sync local with global if global changes
    useEffect(() => {
        if (globalSelectedId) {
            setSelectedChildId(globalSelectedId);
        }
    }, [globalSelectedId]);

    // Also update global if local changes to a specific child
    const handleChildChange = (id: string) => {
        setSelectedChildId(id);
        if (id !== "all") {
            setGlobalSelectedId(id);
        } else {
            setGlobalSelectedId(null);
        }
    };

    if (!currentUser) return null;

    const childrenIds = new Set(children.map(c => c.id.toString()));

    const studentAttendance = allAttendance.filter((a: any) => {
        const matchChild = selectedChildId === "all" || a.student_id?.toString() === selectedChildId;
        return childrenIds.has(a.student_id?.toString()) && matchChild;
    });
    
    const leaveRequests = allIzin.filter((l: any) => {
        const matchChild = selectedChildId === "all" || l.student_id?.toString() === selectedChildId;
        return childrenIds.has(l.student_id?.toString()) && matchChild;
    });

    const statusBadge = (status: string) => {
        const sKey = status?.toUpperCase() || "";
        const map: Record<string, { label: string; cls: string }> = {
            HADIR: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            IZIN: { label: "Izin", cls: "bg-amber-100 text-amber-700 border-emerald-200" },
            SAKIT: { label: "Sakit", cls: "bg-blue-100 text-blue-700 border-blue-200" },
            ALPHA: { label: "Alpha", cls: "bg-red-100 text-red-700 border-red-200" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-100 text-orange-700 border-orange-200" },
        };
        const s = map[sKey] || { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
        return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
    };

    const isLoading = loadingSiswa || loadingAtt || loadingIzin;

    return (
        <div className="space-y-6 pb-12 font-sans">
            <div className="flex items-center justify-between">
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
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit">
                    <button
                        className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'presensi' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('presensi')}
                    >
                        Kehadiran Harian
                    </button>
                    <button
                        className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'izin' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('izin')}
                    >
                        Status Pengajuan Izin
                    </button>
                    <button
                        className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'rekap' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('rekap')}
                    >
                        Rekapitulasi
                    </button>
                </div>

                {/* Child Filter */}
                {!isLoading && children.length > 1 && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                        <button
                            onClick={() => handleChildChange("all")}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedChildId === "all" ? "bg-[#000080] text-white" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                            Semua Anak
                        </button>
                        {children.map((child) => (
                            <button
                                key={child.id}
                                onClick={() => handleChildChange(child.id.toString())}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedChildId === child.id.toString() ? "bg-[#000080] text-white" : "text-slate-500 hover:bg-slate-50"}`}
                            >
                                {child.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-medium">Mengambil data...</p>
                </div>
            )}

            {!isLoading && activeTab === "presensi" && children
                .filter(child => selectedChildId === "all" || child.id.toString() === selectedChildId)
                .map((child) => {
                const records = studentAttendance.filter(a => a.student_id?.toString() === child.id.toString());
                return (
                    <Card key={child.id} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                            <CardTitle className="text-[#000080] text-xl font-bold">
                                {child.name} <span className="text-slate-400 font-medium text-base ml-2">NIS: {child.nisn || child.noInduk}</span>
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
                                                <p className="text-sm font-bold text-slate-800">{att.subject_name}</p>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Kelas {child.cls} •{" "}
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

            {!isLoading && activeTab === "izin" && (
                <div className="space-y-4">
                    {leaveRequests.length > 0 ? (
                        leaveRequests.map((lr) => (
                            <Card key={lr.id} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={lr.type === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                                                    {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                                </Badge>
                                                <span className="text-sm font-bold text-slate-800">{lr.student_name}</span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500">
                                                {new Date(lr.start_date).toLocaleDateString("id-ID", { dateStyle: 'long' })}
                                                {lr.start_date !== lr.end_date && ` s/d ${new Date(lr.end_date).toLocaleDateString("id-ID", { dateStyle: 'long' })}`}
                                            </p>
                                        </div>
                                        <Badge className={`px-3 py-1 text-xs font-bold shadow-sm ${lr.status === 'PENDING' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                            lr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}>
                                            {lr.status === 'PENDING' ? '⏳ Menunggu Validasi' : lr.status === 'APPROVED' ? '✅ Disetujui' : '❌ Ditolak'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="font-bold text-slate-500 text-xs uppercase tracking-wider block mb-1">Pesan:</span>
                                            {lr.reason}
                                        </div>
                                        {(lr.attachment_url || lr.selfie_url) && (
                                            <div className="flex flex-col gap-2">
                                                {lr.attachment_url && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-[10px] font-bold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                                        onClick={() => setSelectedProofUrl(lr.attachment_url)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" /> Bukti Surat
                                                    </Button>
                                                )}
                                                {lr.selfie_url && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-[10px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                                                        onClick={() => setSelectedProofUrl(lr.selfie_url)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" /> Foto Selfie
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {lr.review_notes && (
                                        <div className={`text-sm p-3 rounded-xl border ${lr.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                            <span className="font-bold text-xs uppercase tracking-wider block mb-1">Pesan dari Guru ({lr.reviewed_by}):</span>
                                            {lr.review_notes}
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

            {!isLoading && activeTab === "rekap" && children
                .filter(child => selectedChildId === "all" || child.id.toString() === selectedChildId)
                .map((child) => {
                    const records = studentAttendance.filter(a => a.student_id?.toString() === child.id.toString());
                    const stats = {
                        HADIR: records.filter(r => r.status?.toUpperCase() === 'HADIR').length,
                        IZIN: records.filter(r => r.status?.toUpperCase() === 'IZIN').length,
                        SAKIT: records.filter(r => r.status?.toUpperCase() === 'SAKIT').length,
                        ALPHA: records.filter(r => r.status?.toUpperCase() === 'ALPHA').length,
                        TERLAMBAT: records.filter(r => r.status?.toUpperCase() === 'TERLAMBAT').length,
                    };

                    return (
                        <Card key={child.id} className="bg-white border-slate-200 shadow-md rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-[#000080] p-8 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-2xl font-black">{child.name}</CardTitle>
                                        <p className="text-blue-200 font-bold mt-1 uppercase tracking-widest text-xs">
                                            NIS: {child.nisn || child.noInduk} • KELAS {child.cls}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                        <ClipboardList className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 text-center">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Hadir</p>
                                        <p className="text-3xl font-black text-emerald-700">{stats.HADIR}</p>
                                    </div>
                                    <div className="bg-amber-50 p-6 rounded-[1.5rem] border border-amber-100 text-center">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Izin</p>
                                        <p className="text-3xl font-black text-amber-700">{stats.IZIN}</p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 text-center">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Sakit</p>
                                        <p className="text-3xl font-black text-blue-700">{stats.SAKIT}</p>
                                    </div>
                                    <div className="bg-red-50 p-6 rounded-[1.5rem] border border-red-100 text-center">
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Alpha</p>
                                        <p className="text-3xl font-black text-red-700">{stats.ALPHA}</p>
                                    </div>
                                    <div className="bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 text-center">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Terlambat</p>
                                        <p className="text-3xl font-black text-orange-700">{stats.TERLAMBAT}</p>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pertemuan Terdata</p>
                                        <p className="text-xl font-black text-[#000080]">{records.length} Mata Pelajaran</p>
                                    </div>
                                    <Button variant="outline" className="rounded-xl font-bold text-[#000080] border-slate-300 bg-white" onClick={() => setActiveTab('presensi')}>
                                        Lihat Detail Harian
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            {!isLoading && children.length === 0 && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    Tidak ada data anak yang terhubung dengan akun Anda.
                </div>
            )}

            {/* Proof Preview Modal */}
            <Dialog open={!!selectedProofUrl} onOpenChange={(open) => !open && setSelectedProofUrl(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10">
                        <DialogTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Lampiran Bukti Pengajuan
                        </DialogTitle>
                    </DialogHeader>
                    <div className="bg-slate-50 p-6 flex justify-center items-center min-h-[300px]">
                        {selectedProofUrl && (
                            <img 
                                src={getUploadUrl(selectedProofUrl)} 
                                alt="Bukti Lampiran" 
                                className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-white"
                                onError={(e: any) => {
                                    e.target.src = "https://placehold.co/400x600?text=Bukti+Tidak+Ditemukan";
                                }}
                            />
                        )}
                    </div>
                    <DialogFooter className="p-3 bg-white border-t">
                        <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => setSelectedProofUrl(null)}>Tutup Preview</Button>
                        {selectedProofUrl && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="text-xs font-bold bg-[#000080]"
                                onClick={() => window.open(getUploadUrl(selectedProofUrl), '_blank')}
                            >
                                Buka di Tab Baru
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
