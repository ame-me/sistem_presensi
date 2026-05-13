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
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, FileText, Filter, Search, Eye, BookOpen, Calendar, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminRekapPage() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const { kelas, loading: loadingKelas } = useKelasData();
    const [selectedKelasId, setSelectedKelasId] = useState<string>("");
    const selectedKelas = kelas.find(k => k.id.toString() === selectedKelasId);
    
    const { attendance, loading: loadingAtt } = useAttendanceData(undefined, undefined, selectedKelas?.name);
    const { siswa: studentsInClass, loading: loadingSiswa } = useSiswaData(selectedKelas?.name);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isPrintingIndividual, setIsPrintingIndividual] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<string>("Genap");

    // Individual print effect
    useEffect(() => {
        if (isPrintingIndividual) {
            const timer = setTimeout(() => {
                window.print();
                setIsPrintingIndividual(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrintingIndividual]);

    // Calculate stats for each student
    const rekapData = useMemo(() => {
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

            return {
                id: student.id,
                name: student.name,
                nis: student.nisn || student.noInduk,
                ...stats,
                total: studentAtt.length
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [studentsInClass, attendance]);

    const handlePrint = () => {
        window.print();
    };

    const isLoading = loadingKelas || (selectedKelasId && (loadingSiswa || loadingAtt));

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
            {/* Detail View (Separate "Page") */}
            {selectedStudent ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Header Detail */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setSelectedStudent(null)}
                                className="rounded-full border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-extrabold text-[#000080]">Detail Presensi</h1>
                                <p className="text-slate-500 font-medium mt-1">
                                    Melihat log kehadiran mendetail untuk {selectedStudent.name}
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setIsPrintingIndividual(true)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Cetak Laporan
                        </Button>
                    </div>

                    {/* Content Detail */}
                    <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[2.5rem] bg-white print:hidden">
                        <CardHeader className="bg-slate-50/80 p-8 border-b border-slate-100 flex flex-row items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-md border border-slate-200 shrink-0">
                                <FileText className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[#000080] uppercase tracking-tight">{selectedStudent.name}</h2>
                                <p className="text-slate-500 font-bold">NIS: {selectedStudent.nis} • Kelas {selectedKelas?.name}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                                {[
                                    { label: "Hadir", val: selectedStudent.HADIR, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                                    { label: "Izin", val: selectedStudent.IZIN, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                                    { label: "Sakit", val: selectedStudent.SAKIT, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                    { label: "Alpha", val: selectedStudent.ALPHA, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                                    { label: "Lambat", val: selectedStudent.TERLAMBAT, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                                ].map(s => (
                                    <div key={s.label} className={cn("p-6 rounded-3xl border text-center shadow-sm transition-all hover:scale-105", s.bg, s.border)}>
                                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">{s.label}</p>
                                        <p className={cn("text-3xl font-black", s.color)}>{s.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-12">
                                {/* Summary per Mapel */}
                                <div>
                                    <h3 className="text-sm font-black text-[#000080] uppercase mb-5 flex items-center gap-2 tracking-widest">
                                        <BookOpen className="w-5 h-5 text-indigo-500" /> Statistik per Mata Pelajaran
                                    </h3>
                                    <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow>
                                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase p-4">Mata Pelajaran</TableHead>
                                                    <TableHead className="text-center font-black text-emerald-600 text-[10px] uppercase p-4">Hadir</TableHead>
                                                    <TableHead className="text-center font-black text-amber-600 text-[10px] uppercase p-4">Izin</TableHead>
                                                    <TableHead className="text-center font-black text-blue-600 text-[10px] uppercase p-4">Sakit</TableHead>
                                                    <TableHead className="text-center font-black text-red-600 text-[10px] uppercase p-4">Alpha</TableHead>
                                                    <TableHead className="text-center font-black text-orange-600 text-[10px] uppercase p-4">Lambat</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(() => {
                                                    const mapelGroups: Record<string, any> = {};
                                                    selectedStudent.history?.forEach((h: any) => {
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
                                                        <TableRow key={k} className="hover:bg-slate-50/30">
                                                            <TableCell className="font-bold text-slate-800 text-sm p-4">{k}</TableCell>
                                                            <TableCell className="text-center font-black text-emerald-600 text-sm bg-emerald-50/10 p-4">{mapelGroups[k].H}</TableCell>
                                                            <TableCell className="text-center font-black text-amber-600 text-sm bg-amber-50/10 p-4">{mapelGroups[k].I}</TableCell>
                                                            <TableCell className="text-center font-black text-blue-600 text-sm bg-blue-50/10 p-4">{mapelGroups[k].S}</TableCell>
                                                            <TableCell className="text-center font-black text-red-600 text-sm bg-red-50/10 p-4">{mapelGroups[k].A}</TableCell>
                                                            <TableCell className="text-center font-black text-orange-600 text-sm bg-orange-50/10 p-4">{mapelGroups[k].T}</TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400 italic text-sm">Belum ada data</TableCell></TableRow>
                                                    );
                                                })()}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Logs Ketidakhadiran */}
                                <div>
                                    <h3 className="text-sm font-black text-red-600 uppercase mb-5 flex items-center gap-2 tracking-widest">
                                        <Clock className="w-5 h-5" /> Detail Ketidakhadiran (I/S/A)
                                    </h3>
                                    <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                        <Table>
                                            <TableHeader className="bg-red-50/50">
                                                <TableRow>
                                                    <TableHead className="font-black text-red-800 text-[10px] uppercase p-4">Tanggal</TableHead>
                                                    <TableHead className="font-black text-red-800 text-[10px] uppercase p-4">Mata Pelajaran</TableHead>
                                                    <TableHead className="text-center font-black text-red-800 text-[10px] uppercase p-4">Status</TableHead>
                                                    <TableHead className="font-black text-red-800 text-[10px] uppercase p-4">Keterangan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(() => {
                                                    const exceptions = selectedStudent.history?.filter((h: any) => h.status?.toUpperCase() !== "HADIR") || [];
                                                    return exceptions.length > 0 ? exceptions.map((h: any, i: number) => (
                                                        <TableRow key={i} className="hover:bg-red-50/10">
                                                            <TableCell className="font-bold text-slate-600 text-sm p-4">
                                                                {new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </TableCell>
                                                            <TableCell className="font-black text-slate-800 text-sm p-4">
                                                                {h.subject_name || h.subject_hint}
                                                            </TableCell>
                                                            <TableCell className="text-center p-4">
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[10px] font-black uppercase px-3 py-1 rounded-full border-2",
                                                                    h.status?.toUpperCase() === "IZIN" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                    h.status?.toUpperCase() === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                    h.status?.toUpperCase() === "ALPHA" ? "bg-red-50 text-red-600 border-red-100" :
                                                                    "bg-orange-50 text-orange-600 border-orange-100"
                                                                )}>
                                                                    {h.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-slate-500 font-medium italic p-4">
                                                                {h.notes || "-"}
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold italic text-sm p-4">
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
            ) : (
                /* Main List View */
                <div id="main-content-to-print" className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#000080]">Rekap Presensi Siswa</h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Generate laporan rekapitulasi kehadiran per semester ({selectedTahunAjaran})
                            </p>
                        </div>
                        <Button 
                            disabled={!selectedKelasId}
                            onClick={handlePrint}
                            className="bg-[#000080] hover:bg-[#000060] text-white font-bold h-12 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Cetak Laporan
                        </Button>
                    </div>

                    {/* Filter Section */}
                    <Card className="border-slate-200 shadow-sm print:hidden rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap items-end gap-6">
                                <div className="space-y-2 min-w-[240px]">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5" /> Pilih Kelas
                                    </label>
                                    <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold text-[#000080]">
                                            <SelectValue placeholder="-- Pilih Kelas --" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            {kelas.map((k) => (
                                                <SelectItem key={k.id} value={k.id.toString()} className="font-bold">
                                                    KELAS {k.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 min-w-[240px]">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Pilih Semester
                                    </label>
                                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold text-[#000080]">
                                            <SelectValue placeholder="-- Pilih Semester --" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            <SelectItem value="Ganjil" className="font-bold text-indigo-600">🍂 Ganjil</SelectItem>
                                            <SelectItem value="Genap" className="font-bold text-emerald-600">🌸 Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {selectedKelasId && (
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-400 uppercase">Tahun Ajaran</p>
                                            <p className="text-sm font-black text-[#000080]">{selectedTahunAjaran}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase">Total Siswa</p>
                                            <p className="text-sm font-black text-emerald-700">{studentsInClass.length} Orang</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rekap Table */}
                    {selectedKelasId ? (
                        <div className="space-y-6">
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
                            <Card className="border-slate-200 shadow-md overflow-hidden rounded-2xl print:shadow-none print:border-none">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between p-6 print:bg-white print:px-0">
                                <div>
                                    <CardTitle className="text-[#000080] text-xl font-black uppercase tracking-tight">
                                        Rekapitulasi Presensi Kelas {selectedKelas?.name}
                                    </CardTitle>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Periode: {selectedTahunAjaran}</p>
                                </div>
                                <FileText className="w-8 h-8 text-slate-200 print:hidden" />
                            </CardHeader>
                            <CardContent className="p-0 print:p-0">
                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <p className="font-bold">Mengkalkulasi data...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table className="print-table">
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-12 text-center font-bold text-slate-600">No</TableHead>
                                                    <TableHead className="font-bold text-slate-600">Nama Siswa</TableHead>
                                                    <TableHead className="font-bold text-slate-600">NIS</TableHead>
                                                    <TableHead className="text-center font-bold text-emerald-600 bg-emerald-50/30">Hadir</TableHead>
                                                    <TableHead className="text-center font-bold text-amber-600 bg-amber-50/30">Izin</TableHead>
                                                    <TableHead className="text-center font-bold text-blue-600 bg-blue-50/30">Sakit</TableHead>
                                                    <TableHead className="text-center font-bold text-red-600 bg-red-50/30">Alpha</TableHead>
                                                    <TableHead className="text-center font-bold text-orange-600 bg-orange-50/30">Terlambat</TableHead>
                                                    <TableHead className="text-center font-black text-[#000080] border-l border-slate-100">Total</TableHead>
                                                    <TableHead className="text-center font-black text-[#000080] print:hidden">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rekapData.length > 0 ? rekapData.map((row, idx) => (
                                                    <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="text-center font-medium text-slate-400 text-xs">{idx + 1}</TableCell>
                                                        <TableCell className="font-bold text-slate-800">{row.name}</TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-500">{row.nis}</TableCell>
                                                        <TableCell className="text-center font-black text-emerald-600">{row.HADIR}</TableCell>
                                                        <TableCell className="text-center font-black text-amber-600">{row.IZIN}</TableCell>
                                                        <TableCell className="text-center font-black text-blue-600">{row.SAKIT}</TableCell>
                                                        <TableCell className="text-center font-black text-red-600">{row.ALPHA}</TableCell>
                                                        <TableCell className="text-center font-black text-orange-600">{row.TERLAMBAT}</TableCell>
                                                        <TableCell className="text-center font-black text-[#000080] border-l border-slate-100 bg-slate-50/30">
                                                            {row.total}
                                                        </TableCell>
                                                        <TableCell className="text-center print:hidden">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const studentHistory = attendance.filter(a => a.student_id?.toString() === row.id.toString());
                                                                    setSelectedStudent({
                                                                        ...row,
                                                                        history: studentHistory
                                                                    });
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold flex items-center gap-1 mx-auto rounded-lg"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Detail
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="h-32 text-center text-slate-400 font-bold italic">
                                                            Tidak ada data siswa ditemukan untuk kelas ini.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        </div>
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 text-slate-400 gap-4">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="font-bold text-lg">Pilih kelas untuk melihat rekapan</p>
                        </div>
                    )}

                    {/* Print Signature Section for Main List */}
                    <div className="hidden print:grid grid-cols-2 gap-20 mt-20 px-10">
                        <div className="text-center">
                            <p className="text-sm font-medium mb-20">Mengetahui,<br/>Kepala Sekolah</p>
                            <p className="font-bold border-b border-slate-800 inline-block px-4">Veronika Suhartati, S.Psi.,M.M</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium mb-20">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Admin Tata Usaha</p>
                            <p className="font-bold border-b border-slate-800 inline-block px-4">Admin TU (Demo)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Report Print Template */}
            <div id="individual-report" className={cn("hidden", isPrintingIndividual && "print:block")}>
                <div className="p-8 text-black bg-white">
                    {/* Header KOP */}
                    <div className="flex items-center gap-6 border-b-4 border-double border-black pb-6 mb-8">
                        <div className="w-24 h-24 bg-white flex items-center justify-center shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center pr-20">
                            <p className="text-sm font-bold uppercase tracking-[0.2em] leading-none mb-2">PERKUMPULAN DHARMAPUTRI</p>
                            <h1 className="text-3xl font-black text-[#000080] uppercase leading-tight whitespace-nowrap">SMP KATOLIK SANTA MARIA 2</h1>
                            <p className="text-md font-bold mt-1 tracking-widest">TERAKREDITASI "A"</p>
                            <p className="text-[10px] font-medium mt-2 leading-relaxed text-slate-700">
                                NPSN: 20533743, NSS: 2030560101019<br />
                                Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115<br />
                                Telp: (0341) 551871 | Email: smpksantamaria2mlg@gmail.com
                            </p>
                        </div>
                    </div>

                    <div className="text-center mb-10 space-y-2">
                        <h2 className="text-2xl font-black uppercase underline decoration-2 underline-offset-8">LAPORAN PRESENSI INDIVIDUAL SISWA</h2>
                        <p className="text-sm font-bold italic pt-2">
                            Periode: {selectedTahunAjaran} {selectedTahunAjaran?.toLowerCase().includes(selectedSemester.toLowerCase()) ? "" : `Semester ${selectedSemester}`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-slate-50 rounded-2xl border-2 border-slate-900">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Nama Lengkap Siswa</p>
                            <p className="text-lg font-bold">{selectedStudent?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Nomor Induk / NISN</p>
                            <p className="text-lg font-bold font-mono tracking-tight">{selectedStudent?.nis}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Kelas / Rombel</p>
                            <p className="text-lg font-bold">KELAS {selectedKelas?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Tahun Ajaran / Semester</p>
                            <p className="text-lg font-bold">{selectedTahunAjaran} ({selectedSemester})</p>
                        </div>
                    </div>

                    <div className="mb-10 print-section">
                        <h3 className="text-xs font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-2 mb-4">I. Statistik Kehadiran Per Mata Pelajaran</h3>
                        <table className="w-full border-collapse border-2 border-slate-900 text-[11px]">
                            <thead>
                                <tr className="bg-slate-200">
                                    <th className="border-2 border-slate-900 p-2 text-left w-[40%]">MATA PELAJARAN</th>
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
                                        // Skip generic "Mata Pelajaran" if it's likely dummy
                                        if (name === "Mata Pelajaran" && selectedStudent?.history?.length > 1) return;
                                        
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

                    <div className="mb-10 print-section">
                        <h3 className="text-xs font-black text-red-700 uppercase border-b-2 border-red-700 pb-2 mb-4">II. Detail Ketidakhadiran & Catatan (Izin/Sakit/Alpha)</h3>
                        <table className="w-full border-collapse border-2 border-slate-900 text-[11px]">
                            <thead>
                                <tr className="bg-red-50">
                                    <th className="border-2 border-slate-900 p-2 text-left w-[20%]">TANGGAL</th>
                                    <th className="border-2 border-slate-900 p-2 text-left w-[30%]">MATA PELAJARAN</th>
                                    <th className="border-2 border-slate-900 p-2 text-center w-[15%]">STATUS</th>
                                    <th className="border-2 border-slate-900 p-2 text-left w-[35%]">KETERANGAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const exceptions = selectedStudent?.history?.filter((h: any) => h.status?.toUpperCase() !== "HADIR") || [];
                                    return exceptions.length > 0 ? exceptions.map((h: any, i: number) => (
                                        <tr key={i}>
                                            <td className="border-2 border-slate-900 p-2 whitespace-nowrap">{new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                            <td className="border-2 border-slate-900 p-2 font-bold">{h.subject_name || h.subject_hint}</td>
                                            <td className="border-2 border-slate-900 p-2 text-center font-black">{h.status}</td>
                                            <td className="border-2 border-slate-900 p-2 italic">{h.notes || "-"}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="border-2 border-slate-900 p-6 text-center italic text-slate-500 font-bold">
                                                Tidak ada catatan ketidakhadiran (Siswa Hadir 100%).
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mt-32 text-black print-section">
                        <div className="text-center">
                            <p className="text-sm font-medium mb-24">Mengetahui,<br/>Kepala Sekolah</p>
                            <p className="font-bold border-b-2 border-black inline-block px-8 pb-1">Veronika Suhartati, S.Psi.,M.M</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium mb-24">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Admin Tata Usaha</p>
                            <p className="font-bold border-b-2 border-black inline-block px-8 pb-1">Admin TU (Demo)</p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: portrait;
                        margin: 1cm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                    ${isPrintingIndividual ? `
                        #main-content-to-print {
                            display: none !important;
                        }
                        #individual-report {
                            display: block !important;
                        }
                    ` : `
                        #main-content-to-print {
                            display: block !important;
                        }
                        #individual-report {
                            display: none !important;
                        }
                    `}
                    .print-section {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .print-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        border: 2px solid black !important;
                    }
                    .print-table th, .print-table td {
                        border: 1.5px solid black !important;
                        color: black !important;
                        padding: 8px 4px !important;
                        background: transparent !important;
                    }
                    .print-table th {
                        background-color: #e2e8f0 !important;
                        font-weight: 900 !important;
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
