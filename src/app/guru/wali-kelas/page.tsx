"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useKelasData } from "@/hooks/useKelasData";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileText, Search, LayoutDashboard, UserCheck, ChevronLeft, BookOpen, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function GuruWaliKelasPage() {
    const router = useRouter();
    const { currentUser, selectedTahunAjaran } = useAppStore();
    const { kelas } = useKelasData();
    
    // Auto detect class name for this teacher
    const waliKelasRombelName = currentUser?.waliKelasRombelName;
    
    const { attendance, loading: loadingAtt } = useAttendanceData(undefined, undefined, waliKelasRombelName || "");
    const { siswa: studentsInClass, loading: loadingSiswa } = useSiswaData(waliKelasRombelName || "");

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showAttentionOnly, setShowAttentionOnly] = useState(false);
    const [isPrintingIndividual, setIsPrintingIndividual] = useState(false);

    // Calculate stats for each student
    const rekapDataFull = useMemo(() => {
        if (!studentsInClass.length) return [];

        return studentsInClass.map(student => {
            const studentAtt = attendance.filter(a => a.student_id?.toString() === student.id.toString());
            
            const stats = {
                HADIR: 0,
                IZIN: 0,
                SAKIT: 0,
                ALPHA: 0,
                TERLAMBAT: 0
            };

            studentAtt.forEach(a => {
                const statusKey = a.status?.toUpperCase() || "";
                if (stats.hasOwnProperty(statusKey)) {
                    stats[statusKey as keyof typeof stats]++;
                }
            });

            const attendancePercent = studentAtt.length > 0 ? (stats.HADIR / studentAtt.length) * 100 : 100;
            const needsAttention = attendancePercent < 80;

            return {
                id: student.id,
                name: student.name,
                nis: student.nisn || student.noInduk,
                stats,
                history: studentAtt,
                total: studentAtt.length,
                attendancePercent,
                needsAttention
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [studentsInClass, attendance]);

    const rekapData = useMemo(() => {
        if (showAttentionOnly) {
            return rekapDataFull.filter(s => s.needsAttention);
        }
        return rekapDataFull;
    }, [rekapDataFull, showAttentionOnly]);

    const attentionCount = useMemo(() => {
        return rekapDataFull.filter(s => s.needsAttention).length;
    }, [rekapDataFull]);

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (isPrintingIndividual) {
            const timer = setTimeout(() => {
                window.print();
                setIsPrintingIndividual(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrintingIndividual]);

    const handlePrintIndividual = () => {
        setIsPrintingIndividual(true);
    };

    const isLoading = loadingSiswa || loadingAtt;

    if (!waliKelasRombelName) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardTitle className="text-red-600">Akses Dibatasi</CardTitle>
                    <CardDescription className="mt-2">Akun Anda tidak terdaftar sebagai Wali Kelas di rombel manapun.</CardDescription>
                    <Button onClick={() => router.push("/guru/dashboard")} className="mt-6">Kembali ke Dashboard Guru</Button>
                </Card>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @media screen {
                    #individual-report {
                        display: none !important;
                    }
                }
                @media print {
                    @page { 
                        size: portrait; 
                        margin: 10mm;
                    }
                    html, body {
                        background: white !important;
                        font-family: 'Times New Roman', serif;
                        overflow: visible !important;
                        height: auto !important;
                    }
                    .print-hidden, button, .no-print {
                        display: none !important;
                    }
                    .shadow-md, .shadow-sm, .shadow-lg, .shadow-2xl {
                        shadow: none !important;
                        box-shadow: none !important;
                    }
                    .border-none {
                        border: 1px solid #e2e8f0 !important;
                    }
                    .rounded-3xl, .rounded-2xl, .rounded-xl {
                        border-radius: 0 !important;
                    }
                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 8px !important;
                        color: black !important;
                        background: transparent !important;
                    }
                    .bg-slate-50, .bg-indigo-50, .bg-emerald-50, .bg-amber-50, .bg-blue-50, .bg-red-50 {
                        background: transparent !important;
                    }
                    .text-[#000080], .text-indigo-600, .text-emerald-600, .text-amber-600, .text-red-600 {
                        color: black !important;
                    }
                }
            `}</style>
            <div className={cn("space-y-6 pb-20 font-sans", isPrintingIndividual ? "hidden" : "block")}>
                {!selectedStudent ? (
                    <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push("/select-role")}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#000080]">Panel Wali Kelas</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Laporan kehadiran siswa Kelas <b>{waliKelasRombelName}</b> ({selectedTahunAjaran})
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={handlePrint}
                        className="bg-[#000080] hover:bg-[#000060] text-white font-bold h-12 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Cetak Laporan Kelas
                    </Button>
                </div>
            </div>

            {/* Print Header for Document (Class Report) */}
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
                <div className="mt-8 text-center space-y-2">
                    <h2 className="text-2xl font-black uppercase underline decoration-2 underline-offset-8">LAPORAN REKAPITULASI PRESENSI SISWA</h2>
                    <p className="text-sm font-bold italic pt-2">Tahun Pelajaran {selectedTahunAjaran}</p>
                </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <Card 
                    className={cn(
                        "border-slate-100 shadow-sm cursor-pointer transition-all hover:scale-[1.02]",
                        !showAttentionOnly ? "bg-white" : "bg-slate-50 opacity-50"
                    )}
                    onClick={() => setShowAttentionOnly(false)}
                >
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Siswa</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{studentsInClass.length} <span className="text-sm font-bold text-slate-400 ml-1">Anak</span></p>
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Rata-rata Hadir</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">98%</p>
                    </CardContent>
                </Card>
                <Card 
                    className={cn(
                        "border-slate-100 shadow-sm cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden",
                        showAttentionOnly ? "ring-2 ring-amber-500 bg-amber-50/30 shadow-md" : "bg-white"
                    )}
                    onClick={() => setShowAttentionOnly(!showAttentionOnly)}
                >
                    <CardContent className="p-5">
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            Butuh Perhatian
                            {showAttentionOnly && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        </div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                            {attentionCount} <span className="text-sm font-bold text-slate-400 ml-1">Siswa</span>
                        </div>
                        {showAttentionOnly && (
                            <div className="absolute -right-2 -bottom-2 opacity-5 text-amber-600">
                                <Search className="w-12 h-12" />
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Status Kelas</p>
                        <p className="text-2xl font-black text-[#000080] mt-1 uppercase">Aktif</p>
                    </CardContent>
                </Card>
            </div>

            {/* Rekap Table */}
            <Card className="border-slate-200 shadow-md overflow-hidden rounded-3xl border-none ring-1 ring-slate-100 print:shadow-none print:border-none">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between p-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <UserCheck className="w-6 h-6 text-[#000080]" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-[#000080] text-xl font-black uppercase tracking-tight">
                                    Rekapitulasi Presensi Kelas {waliKelasRombelName}
                                </CardTitle>
                                {showAttentionOnly && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 animate-in fade-in zoom-in duration-300">
                                        Filter: Butuh Perhatian
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="font-bold">Periode Aktif: {selectedTahunAjaran}</CardDescription>
                        </div>
                    </div>
                    {showAttentionOnly && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAttentionOnly(false)}
                            className="text-amber-700 hover:text-amber-800 font-bold"
                        >
                            Reset Filter
                        </Button>
                    )}
                </CardHeader>
                <div className="hidden print:block mb-4 px-1">
                    <p className="text-sm font-black">KELAS: {waliKelasRombelName}</p>
                </div>
                <CardContent className="p-0 print:p-0">
                    {isLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#000080]" />
                            <p className="font-black text-lg">Menyiapkan laporan kelas Anda...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="print-table">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12 text-center font-black text-[#000080]">NO</TableHead>
                                        <TableHead className="font-black text-[#000080]">NAMA SISWA</TableHead>
                                        <TableHead className="font-black text-[#000080]">NIS/NISN</TableHead>
                                        <TableHead className="text-center font-black text-emerald-600 bg-emerald-50/20">H</TableHead>
                                        <TableHead className="text-center font-black text-amber-600 bg-amber-50/20">I</TableHead>
                                        <TableHead className="text-center font-black text-blue-600 bg-blue-50/20">S</TableHead>
                                        <TableHead className="text-center font-black text-red-600 bg-red-50/20">A</TableHead>
                                        <TableHead className="text-center font-black text-orange-600 bg-orange-50/20">T</TableHead>
                                        <TableHead className="text-center font-black text-[#000080] bg-indigo-50/30 border-l border-slate-100">TOTAL</TableHead>
                                        {showAttentionOnly && (
                                            <TableHead className="text-center font-black text-red-600 bg-red-50/50">PERSENTASE</TableHead>
                                        )}
                                        <TableHead className="text-center font-black text-[#000080] print:hidden">AKSI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rekapData.length > 0 ? rekapData.map((row, idx) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <TableCell className="text-center font-black text-slate-300 text-xs">{idx + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-700 group-hover:text-[#000080] transition-colors">{row.name}</TableCell>
                                            <TableCell className="font-mono text-[10px] font-bold text-slate-400">{row.nis}</TableCell>
                                            <TableCell className="text-center font-black text-emerald-600">{row.stats.HADIR}</TableCell>
                                            <TableCell className="text-center font-black text-amber-600">{row.stats.IZIN}</TableCell>
                                            <TableCell className="text-center font-black text-blue-600">{row.stats.SAKIT}</TableCell>
                                            <TableCell className="text-center font-black text-red-600">{row.stats.ALPHA}</TableCell>
                                            <TableCell className="text-center font-black text-orange-600">{row.stats.TERLAMBAT}</TableCell>
                                            <TableCell className="text-center font-black text-[#000080] border-l border-slate-100 bg-indigo-50/10">
                                                {row.total}
                                            </TableCell>
                                            {showAttentionOnly && (
                                                <TableCell className="text-center font-black text-red-600 bg-red-50/20">
                                                    {Math.round(row.attendancePercent)}%
                                                </TableCell>
                                            )}
                                            <TableCell className="text-center print:hidden">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-xs font-black text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 rounded-lg"
                                                    onClick={() => setSelectedStudent(row)}
                                                >
                                                    Detail Log
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-40 text-center text-slate-400 font-black italic">
                                                Belum ada data presensi siswa untuk rombel ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            </>
            ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 print:hidden">
                <div className="flex items-center gap-4 print:hidden">
                    <Button 
                        variant="ghost" 
                        onClick={() => setSelectedStudent(null)}
                        className="hover:bg-slate-100 bg-white shadow-sm border border-slate-100 rounded-xl px-4 h-11"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1 text-slate-500" />
                        <span className="font-bold text-slate-700">Kembali ke Data Kelas</span>
                    </Button>
                </div>
                
                <Card className="border-none shadow-md overflow-hidden rounded-3xl bg-white print:hidden">
                    <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex flex-row items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                                    <FileText className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-[#000080] uppercase tracking-tight">
                                        Log Presensi Individual
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-bold mt-1">
                                        {selectedStudent?.name} ({selectedStudent?.nis})
                                    </CardDescription>
                                </div>
                            </div>
                            <Button 
                                onClick={handlePrintIndividual} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-11 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                <Printer className="w-4 h-4" />
                                Cetak Laporan
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 pt-6">
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {[
                                { label: "Hadir", val: selectedStudent?.stats.HADIR, color: "text-emerald-600", bg: "bg-emerald-50" },
                                { label: "Izin", val: selectedStudent?.stats.IZIN, color: "text-amber-600", bg: "bg-amber-50" },
                                { label: "Sakit", val: selectedStudent?.stats.SAKIT, color: "text-blue-600", bg: "bg-blue-50" },
                                { label: "Alpha", val: selectedStudent?.stats.ALPHA, color: "text-red-600", bg: "bg-red-50" },
                                { label: "Lambat", val: selectedStudent?.stats.TERLAMBAT, color: "text-orange-600", bg: "bg-orange-50" },
                            ].map(s => (
                                <div key={s.label} className={cn("p-4 rounded-2xl border text-center transition-all", s.bg, "border-transparent")}>
                                    <p className="text-[10px] font-black uppercase opacity-60">{s.label}</p>
                                    <p className={cn("text-xl font-black mt-1", s.color)}>{s.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-8">
                            {/* Summary per Mapel */}
                            <div>
                                <h3 className="text-sm font-black text-[#000080] uppercase mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Statistik per Mata Pelajaran
                                </h3>
                                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-black text-slate-600 text-[10px] uppercase">Mata Pelajaran</TableHead>
                                                <TableHead className="text-center font-black text-emerald-600 text-[10px] uppercase">H</TableHead>
                                                <TableHead className="text-center font-black text-amber-600 text-[10px] uppercase">I</TableHead>
                                                <TableHead className="text-center font-black text-blue-600 text-[10px] uppercase">S</TableHead>
                                                <TableHead className="text-center font-black text-red-600 text-[10px] uppercase">A</TableHead>
                                                <TableHead className="text-center font-black text-orange-600 text-[10px] uppercase">T</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                const mapelGroups: Record<string, any> = {};
                                                selectedStudent?.history?.forEach((h: any) => {
                                                    const name = h.subject_name || h.subject_hint || "Mata Pelajaran";
                                                    if (!mapelGroups[name]) mapelGroups[name] = { H: 0, I: 0, S: 0, A: 0, T: 0 };
                                                    const s = h.status?.toUpperCase();
                                                    if (s === "HADIR") mapelGroups[name].H++;
                                                    else if (s === "IZIN") mapelGroups[name].I++;
                                                    else if (s === "SAKIT") mapelGroups[name].S++;
                                                    else if (s === "ALPHA") mapelGroups[name].A++;
                                                    else if (s === "TERLAMBAT") mapelGroups[name].T++;
                                                });
                                                const keys = Object.keys(mapelGroups).sort();
                                                return keys.length > 0 ? keys.map(k => (
                                                    <TableRow key={k}>
                                                        <TableCell className="font-bold text-slate-800 text-xs">{k}</TableCell>
                                                        <TableCell className="text-center font-black text-emerald-600 text-xs bg-emerald-50/20">{mapelGroups[k].H}</TableCell>
                                                        <TableCell className="text-center font-black text-amber-600 text-xs bg-amber-50/20">{mapelGroups[k].I}</TableCell>
                                                        <TableCell className="text-center font-black text-blue-600 text-xs bg-blue-50/20">{mapelGroups[k].S}</TableCell>
                                                        <TableCell className="text-center font-black text-red-600 text-xs bg-red-50/20">{mapelGroups[k].A}</TableCell>
                                                        <TableCell className="text-center font-black text-orange-600 text-xs bg-orange-50/20">{mapelGroups[k].T}</TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow><TableCell colSpan={6} className="text-center py-4 text-slate-400 italic text-xs">Belum ada data</TableCell></TableRow>
                                                );
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Logs Ketidakhadiran */}
                            <div>
                                <h3 className="text-sm font-black text-red-600 uppercase mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Detail Ketidakhadiran (I/S/A)
                                </h3>
                                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-red-50/50">
                                            <TableRow>
                                                <TableHead className="font-black text-red-800 text-[10px] uppercase">Tanggal</TableHead>
                                                <TableHead className="font-black text-red-800 text-[10px] uppercase">Mata Pelajaran</TableHead>
                                                <TableHead className="text-center font-black text-red-800 text-[10px] uppercase">Status</TableHead>
                                                <TableHead className="font-black text-red-800 text-[10px] uppercase">Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                const exceptions = selectedStudent?.history?.filter((h: any) => h.status?.toUpperCase() !== "HADIR") || [];
                                                return exceptions.length > 0 ? exceptions.map((h: any, i: number) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-bold text-slate-600 text-xs">
                                                            {new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell className="font-black text-slate-800 text-xs">
                                                            {h.subject_name || h.subject_hint}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                                                h.status === "IZIN" ? "bg-amber-100 text-amber-700" :
                                                                h.status === "SAKIT" ? "bg-blue-100 text-blue-700" :
                                                                h.status === "ALPHA" ? "bg-red-100 text-red-700" :
                                                                "bg-orange-100 text-orange-700"
                                                            )}>
                                                                {h.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-[10px] text-slate-500 font-medium italic">
                                                            {h.notes || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-20 text-center text-slate-400 font-bold italic text-xs">
                                                            Siswa memiliki catatan kehadiran sempurna (100% Hadir).
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            )}

            {/* Print Footer for Document (Class Report Signatures) */}
            <div className="hidden print:block mt-20 break-inside-avoid px-8">
                <div className="grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <p className="text-sm font-medium mb-24">Mengetahui,<br/>Kepala Sekolah</p>
                        <p className="font-bold border-b-2 border-slate-900 inline-block px-8 pb-1">Veronika Suhartati, S.Psi.,M.M</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium mb-24">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Wali Kelas {waliKelasRombelName}</p>
                        <p className="font-bold border-b-2 border-slate-900 inline-block px-8 pb-1">{currentUser?.name}</p>
                    </div>
                </div>
            </div>

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

            {/* Hidden Area for Individual Print */}
            <div id="individual-report" className={cn(isPrintingIndividual ? "block" : "hidden")}>
                <div className="p-10 font-sans text-slate-900 bg-white min-h-screen">
                    {/* Formal Kop Surat */}
                    <div className="flex items-center gap-8 border-b-4 border-black pb-6 mb-8">
                        <div className="w-28 h-28 shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center pr-28">
                            <p className="text-sm font-bold uppercase tracking-[0.2em] leading-none mb-2">PERKUMPULAN DHARMAPUTRI</p>
                            <h1 className="text-3xl font-black text-[#000080] uppercase leading-tight whitespace-nowrap">SMP KATOLIK SANTA MARIA 2</h1>
                            <p className="text-md font-bold mt-1 tracking-widest">TERAKREDITASI "A"</p>
                            <p className="text-[11px] font-medium mt-2 leading-relaxed text-slate-700">
                                NPSN: 20533833, NSS: 203056101022, NDS: 2005320123<br />
                                Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115<br />
                                Telp: 0341-368209, WA: 085712355121 | Email: smpksantamaria2@yahoo.co.id
                            </p>
                        </div>
                    </div>

                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-2xl font-black uppercase underline decoration-2 underline-offset-8">LAPORAN PRESENSI INDIVIDUAL SISWA</h2>
                        <p className="text-sm font-bold italic pt-2">Tahun Pelajaran {selectedTahunAjaran}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Nama Siswa</p>
                            <p className="text-lg font-bold">{selectedStudent?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Nomor Induk / NISN</p>
                            <p className="text-lg font-bold">{selectedStudent?.nis}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Kelas / Rombel</p>
                            <p className="text-lg font-bold">{waliKelasRombelName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Tahun Ajaran</p>
                            <p className="text-lg font-bold">{selectedTahunAjaran}</p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-xs font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-2 mb-4">Statistik Per Mata Pelajaran</h3>
                        <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border-2 border-slate-900 p-2 text-left">MATA PELAJARAN</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">HADIR</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">IZIN</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">SAKIT</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">ALPHA</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">LAMBAT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const mapelGroups: Record<string, any> = {};
                                    selectedStudent?.history?.forEach((h: any) => {
                                        const name = h.subject_name || h.subject_hint || "Mata Pelajaran";
                                        if (!mapelGroups[name]) mapelGroups[name] = { H: 0, I: 0, S: 0, A: 0, T: 0 };
                                        const s = h.status?.toUpperCase();
                                        if (s === "HADIR") mapelGroups[name].H++;
                                        else if (s === "IZIN") mapelGroups[name].I++;
                                        else if (s === "SAKIT") mapelGroups[name].S++;
                                        else if (s === "ALPHA") mapelGroups[name].A++;
                                        else if (s === "TERLAMBAT") mapelGroups[name].T++;
                                    });
                                    return Object.keys(mapelGroups).sort().map(k => (
                                        <tr key={k}>
                                            <td className="border-2 border-slate-900 p-2 font-bold">{k}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center">{mapelGroups[k].H}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center">{mapelGroups[k].I}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center">{mapelGroups[k].S}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center">{mapelGroups[k].A}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center">{mapelGroups[k].T}</td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-xs font-black text-red-600 uppercase border-b-2 border-red-600 pb-2 mb-4">Detail Ketidakhadiran (Exceptions)</h3>
                        <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                            <thead>
                                <tr className="bg-red-50">
                                    <th className="border-2 border-slate-900 p-2 text-left">TANGGAL</th>
                                    <th className="border-2 border-slate-900 p-2 text-left">MATA PELAJARAN</th>
                                    <th className="border-2 border-slate-900 p-2 text-center">STATUS</th>
                                    <th className="border-2 border-slate-900 p-2 text-left">KETERANGAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedStudent?.history?.filter((h: any) => h.status?.toUpperCase() !== "HADIR").map((h: any, i: number) => (
                                    <tr key={i}>
                                        <td className="border-2 border-slate-900 p-2">{new Date(h.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                                        <td className="border-2 border-slate-900 p-2 font-bold">{h.subject_name || h.subject_hint}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-black">{h.status}</td>
                                        <td className="border-2 border-slate-900 p-2 italic">{h.notes || "-"}</td>
                                    </tr>
                                ))}
                                {selectedStudent?.history?.filter((h: any) => h.status?.toUpperCase() !== "HADIR").length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="border-2 border-slate-900 p-6 text-center italic text-slate-400">Tidak ada catatan ketidakhadiran.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mt-32">
                        <div className="text-center">
                            <p className="text-sm font-medium mb-24">Mengetahui,<br/>Kepala Sekolah</p>
                            <p className="font-bold border-b-2 border-slate-900 inline-block px-8 pb-1">Veronika Suhartati, S.Psi.,M.M</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium mb-24">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Wali Kelas {waliKelasRombelName}</p>
                            <p className="font-bold border-b-2 border-slate-900 inline-block px-8 pb-1">{currentUser?.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
