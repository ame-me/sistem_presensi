"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Eye, FileText, ClipboardList, Printer } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData } from "@/hooks/useIzinData";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl, getUploadUrl } from "@/lib/api-config";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useJadwalData } from "@/hooks/useJadwalData";
import { Calendar } from "lucide-react";

function AffectedSubjects({ startDate, endDate, className, tahunAjaran }: { startDate: string, endDate: string, className: string, tahunAjaran?: string }) {
    const { jadwal, loading } = useJadwalData(undefined, className, undefined, tahunAjaran);
    
    if (loading) return <div className="text-[10px] text-slate-400 animate-pulse">Menghitung mata pelajaran yang terdampak...</div>;
    if (!jadwal || jadwal.length === 0) return <div className="text-[10px] text-slate-400 italic">Tidak ada jadwal ditemukan untuk kelas {className}</div>;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const affectedDays: string[] = [];
    
    // Get all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const rawDay = d.toLocaleDateString('id-ID', { weekday: 'long' });
        // Normalize to UPPERCASE to match database ('SENIN', 'RABU', etc)
        const dayName = rawDay.toUpperCase();
        if (!affectedDays.includes(dayName)) affectedDays.push(dayName);
    }

    const dayMap: { [key: string]: string } = {
        'SENIN': 'SENIN',
        'SELASA': 'SELASA',
        'RABU': 'RABU',
        'KAMIS': 'KAMIS',
        'JUMAT': 'JUMAT',
        'SABTU': 'SABTU',
        'MINGGU': 'MINGGU'
    };

    return (
        <div className="mt-4 space-y-3">
            <h4 className="text-[10px] font-black text-[#000080] uppercase tracking-widest border-b border-slate-100 pb-1">
                📅 Detail Hari & Mata Pelajaran Terdampak:
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {affectedDays.map(dayName => {
                    const mappedDay = dayMap[dayName] || dayName;
                    const dayJadwal = jadwal.filter(j => j.day === mappedDay);
                    
                    if (dayJadwal.length === 0) return null;

                    return (
                        <div key={dayName} className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" /> {dayName}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {dayJadwal.map((j, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-white border-slate-200 text-slate-600 font-medium">
                                        {j.time_range.split(' ')[0]} - {j.teacher_mapel || j.subject_hint || j.teacher_code || 'Mata Pelajaran'}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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

    const handlePrint = () => {
        window.print();
    };

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
        <div className="space-y-6 pb-12 font-sans print:p-0 print:space-y-4">
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        href="/ortu/dashboard"
                        className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#000080] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#000080]">Riwayat & Izin</h1>
                        <p className="text-slate-500 font-medium mt-0.5">Pantau histori kehadiran harian dan status izin anak Anda</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between print:hidden">
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
                    <div key={child.id} className="space-y-6">
                        {/* Print Only KOP */}
                        <div className="hidden print:flex items-center gap-6 border-b-4 border-double border-black pb-6 mb-8 text-black">
                            <div className="w-28 h-28 bg-white flex items-center justify-center shrink-0">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 text-center">
                                <h2 className="text-base font-bold uppercase tracking-widest text-slate-800">PERKUMPULAN DHARMAPUTRI</h2>
                                <h1 className="text-3xl font-black uppercase tracking-tight text-[#000080]">SMP KATOLIK SANTA MARIA 2</h1>
                                <p className="text-sm font-bold mt-1">TERAKREDITASI "A"</p>
                                <p className="text-[11px] font-medium mt-1">NPSN: 20533743, NSS: 2030560101019</p>
                                <p className="text-[11px] font-medium mt-0.5">Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115</p>
                                <p className="text-[11px] font-medium italic mt-0.5 whitespace-nowrap">Telepon: (0341) 551871 | Email: smpksantamaria2mlg@gmail.com</p>
                            </div>
                        </div>
                        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden print:shadow-none print:border-none">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between print:bg-white print:border-b-2 print:border-slate-800">
                            <div>
                                <CardTitle className="text-[#000080] text-xl font-bold print:text-black">
                                    {child.name}
                                </CardTitle>
                                <p className="text-slate-400 font-medium text-sm mt-1 print:text-slate-600">NIS: {child.nisn || child.noInduk} • KELAS {child.cls}</p>
                            </div>
                            <Button 
                                onClick={handlePrint}
                                variant="outline"
                                className="border-slate-300 text-[#000080] font-bold rounded-xl flex items-center gap-2 print:hidden"
                            >
                                <Printer className="w-4 h-4" />
                                Cetak Riwayat
                            </Button>
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

                            {/* Print Only Signature Section */}
                            <div className="hidden print:grid grid-cols-2 gap-20 mt-20">
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-20">Mengetahui,<br/>Wali Kelas {child.cls}</p>
                                    <p className="font-bold border-b border-slate-800 inline-block px-4">Wali Kelas</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-20">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Orang Tua / Wali Murid</p>
                                    <p className="font-bold border-b border-slate-800 inline-block px-4">{currentUser?.name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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

                                    {/* Affected Subjects Detail */}
                                    {lr.cls && (
                                        <AffectedSubjects 
                                            startDate={lr.start_date} 
                                            endDate={lr.end_date} 
                                            className={lr.cls} 
                                            tahunAjaran={lr.tahun_ajaran}
                                        />
                                    )}

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
                        <div key={child.id} className="space-y-6 print:space-y-8">
                            {/* Print Only KOP */}
                            <div className="hidden print:flex items-center gap-6 border-b-4 border-double border-black pb-6 mb-8 text-black">
                                <div className="w-28 h-28 bg-white flex items-center justify-center shrink-0">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 text-center">
                                    <h2 className="text-base font-bold uppercase tracking-widest text-slate-800">PERKUMPULAN DHARMAPUTRI</h2>
                                    <h1 className="text-3xl font-black uppercase tracking-tight text-[#000080]">SMP KATOLIK SANTA MARIA 2</h1>
                                    <p className="text-sm font-bold mt-1">TERAKREDITASI "A"</p>
                                    <p className="text-[11px] font-medium mt-1">NPSN: 20533743, NSS: 2030560101019</p>
                                    <p className="text-[11px] font-medium mt-0.5">Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115</p>
                                    <p className="text-[11px] font-medium italic mt-0.5 whitespace-nowrap">Telepon: (0341) 551871 | Email: smpksantamaria2mlg@gmail.com</p>
                                </div>
                            </div>

                            <Card className="bg-white border-slate-200 shadow-md rounded-[2rem] overflow-hidden print:shadow-none print:border-none print:rounded-none">
                                <CardHeader className="bg-[#000080] p-8 text-white flex flex-row items-center justify-between print:bg-white print:text-black print:px-0 print:border-b-2 print:border-black print:mb-6">
                                    <div>
                                        <CardTitle className="text-2xl font-black print:text-3xl">LAPORAN REKAPITULASI PRESENSI</CardTitle>
                                        <p className="text-blue-200 font-bold mt-1 uppercase tracking-widest text-xs print:text-black print:text-sm">
                                            NAMA: {child.name} • NIS: {child.nisn || child.noInduk} • KELAS: {child.cls}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 items-center print:hidden">
                                        <Button 
                                            onClick={handlePrint}
                                            className="bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-6 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg transition-all"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Cetak Laporan
                                        </Button>
                                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                            <ClipboardList className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 print:px-0 print:py-0">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:mb-10">
                                        <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 text-center print:bg-white print:border-2 print:border-black print:rounded-none">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 print:text-black print:text-xs">Hadir</p>
                                            <p className="text-3xl font-black text-emerald-700 print:text-black">{stats.HADIR}</p>
                                        </div>
                                        <div className="bg-amber-50 p-6 rounded-[1.5rem] border border-amber-100 text-center print:bg-white print:border-2 print:border-black print:rounded-none">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 print:text-black print:text-xs">Izin</p>
                                            <p className="text-3xl font-black text-amber-700 print:text-black">{stats.IZIN}</p>
                                        </div>
                                        <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 text-center print:bg-white print:border-2 print:border-black print:rounded-none">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 print:text-black print:text-xs">Sakit</p>
                                            <p className="text-3xl font-black text-blue-700 print:text-black">{stats.SAKIT}</p>
                                        </div>
                                        <div className="bg-red-50 p-6 rounded-[1.5rem] border border-red-100 text-center print:bg-white print:border-2 print:border-black print:rounded-none">
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 print:text-black print:text-xs">Alpha</p>
                                            <p className="text-3xl font-black text-red-700 print:text-black">{stats.ALPHA}</p>
                                        </div>
                                        <div className="bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 text-center print:bg-white print:border-2 print:border-black print:rounded-none">
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 print:text-black print:text-xs">Terlambat</p>
                                            <p className="text-3xl font-black text-orange-700 print:text-black">{stats.TERLAMBAT}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between print:hidden">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Pertemuan Terdata</p>
                                            <p className="text-xl font-black text-[#000080]">{records.length} Mata Pelajaran</p>
                                        </div>
                                        <Button variant="outline" className="rounded-xl font-bold text-[#000080] border-slate-300 bg-white" onClick={() => setActiveTab('presensi')}>
                                            Lihat Detail Harian
                                        </Button>
                                    </div>

                                    {/* Detailed Stats Table */}
                                    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 print:border-2 print:border-black print:rounded-none print:mt-10">
                                <Table className="print-table">
                                    <TableHeader className="bg-slate-50 print:bg-white">
                                        <TableRow className="print:border-b-2 print:border-black">
                                            <TableHead className="font-bold text-slate-600 print:text-black print:font-black uppercase">Kategori Kehadiran</TableHead>
                                            <TableHead className="text-center font-bold text-slate-600 print:text-black print:font-black uppercase">Jumlah Hari</TableHead>
                                            <TableHead className="text-center font-bold text-slate-600 print:text-black print:font-black uppercase">Persentase</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                            <TableBody>
                                                <TableRow className="print:border-b print:border-black">
                                                    <TableCell className="font-bold text-emerald-600 print:text-black">Hadir</TableCell>
                                                    <TableCell className="text-center font-black text-emerald-700 print:text-black">{stats.HADIR}</TableCell>
                                                    <TableCell className="text-center font-medium text-slate-500 italic print:text-black print:not-italic">{records.length > 0 ? ((stats.HADIR / records.length) * 100).toFixed(1) : 0}%</TableCell>
                                                </TableRow>
                                                <TableRow className="print:border-b print:border-black">
                                                    <TableCell className="font-bold text-amber-600 print:text-black">Izin</TableCell>
                                                    <TableCell className="text-center font-black text-amber-700 print:text-black">{stats.IZIN}</TableCell>
                                                    <TableCell className="text-center font-medium text-slate-500 italic print:text-black print:not-italic">{records.length > 0 ? ((stats.IZIN / records.length) * 100).toFixed(1) : 0}%</TableCell>
                                                </TableRow>
                                                <TableRow className="print:border-b print:border-black">
                                                    <TableCell className="font-bold text-blue-600 print:text-black">Sakit</TableCell>
                                                    <TableCell className="text-center font-black text-blue-700 print:text-black">{stats.SAKIT}</TableCell>
                                                    <TableCell className="text-center font-medium text-slate-500 italic print:text-black print:not-italic">{records.length > 0 ? ((stats.SAKIT / records.length) * 100).toFixed(1) : 0}%</TableCell>
                                                </TableRow>
                                                <TableRow className="print:border-b print:border-black">
                                                    <TableCell className="font-bold text-red-600 print:text-black">Alpha</TableCell>
                                                    <TableCell className="text-center font-black text-red-700 print:text-black">{stats.ALPHA}</TableCell>
                                                    <TableCell className="text-center font-medium text-slate-500 italic print:text-black print:not-italic">{records.length > 0 ? ((stats.ALPHA / records.length) * 100).toFixed(1) : 0}%</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-slate-50/50 print:bg-white print:font-black">
                                                    <TableCell className="font-black text-[#000080] print:text-black">TOTAL PERTEMUAN</TableCell>
                                                    <TableCell className="text-center font-black text-[#000080] print:text-black">{records.length}</TableCell>
                                                    <TableCell className="text-center font-black text-[#000080] print:text-black">100%</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Print Only Signature Section */}
                                    <div className="hidden print:grid grid-cols-2 gap-20 mt-20 text-black">
                                        <div className="text-center">
                                            <p className="text-sm font-medium mb-24">Mengetahui,<br/>Wali Kelas {child.cls}</p>
                                            <p className="font-bold border-b-2 border-black inline-block px-8 pb-1">Wali Kelas</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium mb-24">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Orang Tua / Wali Murid</p>
                                            <p className="font-bold border-b-2 border-black inline-block px-8 pb-1">{currentUser?.name}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                                src={selectedProofUrl.startsWith('data:') ? selectedProofUrl : getUploadUrl(selectedProofUrl)} 
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
                                onClick={() => window.open(selectedProofUrl.startsWith('data:') ? selectedProofUrl : getUploadUrl(selectedProofUrl), '_blank')}
                            >
                                Buka di Tab Baru
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        margin: 1.5cm !important;
                    }
                    .print-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        border: 1.5px solid black !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid black !important;
                        color: black !important;
                        padding: 8px 4px !important;
                        background: transparent !important;
                    }
                    .print-table th {
                        background-color: #f1f5f9 !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        font-size: 10px !important;
                    }
                    .print-table td {
                        font-size: 11px !important;
                    }
                }
            ` }} />
        </div>
    );
}
