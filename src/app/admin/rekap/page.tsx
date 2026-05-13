"use client";

import { useState, useMemo } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, FileText, Filter, Search, Eye, ChevronRight, BookOpen, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminRekapPage() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const { kelas, loading: loadingKelas } = useKelasData();
    const [selectedKelasId, setSelectedKelasId] = useState<string>("");
    const selectedKelas = kelas.find(k => k.id.toString() === selectedKelasId);
    
    const { attendance, loading: loadingAtt } = useAttendanceData(undefined, undefined, selectedKelas?.name);
    const { siswa: studentsInClass, loading: loadingSiswa } = useSiswaData(selectedKelas?.name);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

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
        <div className="space-y-6 pb-20 font-sans">
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
            <Card className="border-slate-200 shadow-sm print:hidden">
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

            {/* Student Detail Modal */}
            <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                                <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-[#000080] uppercase tracking-tight">Log Presensi Individual</DialogTitle>
                                <p className="text-slate-500 font-bold mt-0.5">{selectedStudent?.name} ({selectedStudent?.nis})</p>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="p-8">
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {[
                                { label: "Hadir", val: selectedStudent?.HADIR, color: "text-emerald-600", bg: "bg-emerald-50" },
                                { label: "Izin", val: selectedStudent?.IZIN, color: "text-amber-600", bg: "bg-amber-50" },
                                { label: "Sakit", val: selectedStudent?.SAKIT, color: "text-blue-600", bg: "bg-blue-50" },
                                { label: "Alpha", val: selectedStudent?.ALPHA, color: "text-red-600", bg: "bg-red-50" },
                                { label: "Lambat", val: selectedStudent?.TERLAMBAT, color: "text-orange-600", bg: "bg-orange-50" },
                            ].map(s => (
                                <div key={s.label} className={cn("p-4 rounded-2xl border text-center transition-all", s.bg, "border-transparent")}>
                                    <p className="text-[10px] font-black uppercase opacity-60">{s.label}</p>
                                    <p className={cn("text-xl font-black mt-1", s.color)}>{s.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-[#000080] uppercase flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Riwayat Kehadiran Harian
                            </h3>
                            
                            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-slate-600 text-xs">TANGGAL & WAKTU</TableHead>
                                            <TableHead className="font-bold text-slate-600 text-xs">MATA PELAJARAN</TableHead>
                                            <TableHead className="text-center font-bold text-slate-600 text-xs">STATUS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedStudent?.history?.length > 0 ? (
                                            selectedStudent.history
                                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .map((h: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">
                                                                    {new Date(h.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                                    {new Date(h.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-indigo-400" />
                                                            <span className="font-bold text-slate-700 text-sm">
                                                                {h.subject_name || h.subject_hint || "Mata Pelajaran"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2",
                                                                h.status?.toUpperCase() === "HADIR" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                h.status?.toUpperCase() === "IZIN" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                h.status?.toUpperCase() === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                h.status?.toUpperCase() === "ALPHA" ? "bg-red-50 text-red-600 border-red-100" :
                                                                "bg-orange-50 text-orange-600 border-orange-100"
                                                            )}
                                                        >
                                                            {h.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-12 text-center text-slate-400 italic font-bold">
                                                    Belum ada riwayat presensi untuk siswa ini.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Print Signature Section */}
            <div className="hidden print:grid grid-cols-2 gap-20 mt-20 px-10">
                <div className="text-center">
                    <p className="text-sm font-medium mb-20">Mengetahui,<br/>Kepala Sekolah</p>
                    <p className="font-bold border-b border-slate-800 inline-block px-4">Veronika Suhartati, S.Psi.,M.M</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium mb-20">Malang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br/>Admin Tata Usaha</p>
                    <p className="font-bold border-b border-slate-800 inline-block px-4">Admin TU</p>
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
    );
}
