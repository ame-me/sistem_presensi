"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, 
    FileSpreadsheet, 
    Users, 
    UserX, 
    FileText,
    Activity,
    Search,
    Calendar,
    Loader2
} from "lucide-react";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useKelasData } from "@/hooks/useKelasData";
import { toast } from "sonner";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";

export default function AnalitikPelajaranPage() {
    // Current date as default for start/end
    const todayStr = new Date().toISOString().split('T')[0];
    
    const [selectedKelas, setSelectedKelas] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch data using hook
    const { attendance, loading } = useAttendanceData(
        undefined, // date
        undefined, // teacherCode
        selectedKelas === "all" ? undefined : selectedKelas,
        startDate,
        endDate
    );

    const { kelas: classes } = useKelasData();

    // Filter logic on frontend for search and status
    const filteredData = useMemo(() => {
        return attendance.filter(item => {
            const matchesStatus = selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase();
            const matchesSearch = !searchQuery || 
                item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.subject_name && item.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.teacher_code && item.teacher_code.toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesStatus && matchesSearch;
        });
    }, [attendance, selectedStatus, searchQuery]);

    // Calculate Summary
    const stats = useMemo(() => {
        const total = filteredData.length;
        const alpha = filteredData.filter(d => d.status.toLowerCase() === "alpha").length;
        const izin = filteredData.filter(d => d.status.toLowerCase() === "izin").length;
        const sakit = filteredData.filter(d => d.status.toLowerCase() === "sakit").length;
        const hadir = filteredData.filter(d => d.status.toLowerCase() === "hadir").length;
        
        return { total, alpha, izin, sakit, hadir };
    }, [filteredData]);

    const handleExport = () => {
        if (filteredData.length === 0) return toast.error("Tidak ada data untuk diekspor");
        
        const exportData = filteredData.map(d => ({
            "Nama Siswa": d.student_name,
            "Kelas": d.class_name,
            "Mata Pelajaran": d.subject_name,
            "Guru": d.teacher_code,
            "Tanggal": d.date,
            "Status": d.status
        }));

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan_Presensi");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
        const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(fileData, `Laporan_Presensi_${startDate}_to_${endDate}.xlsx`);
        toast.success("Laporan berhasil diunduh");
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "hadir": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "alpha": return "bg-red-100 text-red-700 border-red-200";
            case "izin": return "bg-blue-100 text-blue-700 border-blue-200";
            case "sakit": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-8 pb-20 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-white shadow-sm hover:bg-slate-50 border-slate-200 group">
                            <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Analisa Lengkap Presensi</h1>
                        <p className="text-slate-500 font-medium">Rekapitulasi kehadiran siswa secara komprehensif.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-12 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95">
                        <FileSpreadsheet className="w-5 h-4 mr-2" />
                        Export Laporan (Excel)
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Entri</p>
                                <p className="text-3xl font-black text-blue-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-red-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Alpha (A)</p>
                                <p className="text-3xl font-black text-red-900">{stats.alpha}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                                <UserX className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Izin (I)</p>
                                <p className="text-3xl font-black text-blue-900">{stats.izin}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Sakit (S)</p>
                                <p className="text-3xl font-black text-amber-900">{stats.sakit}</p>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Card */}
            <Card className="bg-white border-slate-200 shadow-md rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <div className="space-y-2 md:col-span-2 lg:col-span-3 xl:col-span-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Periode Laporan</Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="pl-9 h-10" />
                                </div>
                                <span className="text-slate-400 font-bold shrink-0">s/d</span>
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="pl-9 h-10" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Filter Kelas</Label>
                            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                                <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Semua Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.name}>Kelas {c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Status Kehadiran</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="alpha">Alpha (A)</SelectItem>
                                    <SelectItem value="izin">Izin (I)</SelectItem>
                                    <SelectItem value="sakit">Sakit (S)</SelectItem>
                                    <SelectItem value="hadir">Hadir (H)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Pencarian Cepat</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Nama siswa/mapel..." 
                                    className="pl-9 h-10" 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[250px] font-bold text-[#000080]">Nama Siswa</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Kelas</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Mata Pelajaran</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Guru / Kode</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Tanggal</TableHead>
                                    <TableHead className="font-bold text-[#000080] text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                                <p className="text-slate-500 font-medium animate-pulse">Memuat data presensi...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <TableRow key={row.id || idx} className="hover:bg-slate-50/50 group transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                        {row.student_name ? row.student_name.charAt(0) : "?"}
                                                    </div>
                                                    <span className="font-bold text-slate-800 line-clamp-1">{row.student_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white font-bold text-slate-600 border-slate-200">
                                                    {row.class_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-700 min-w-[150px]">
                                                {row.subject_name || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {row.teacher_name ? (
                                                        <>
                                                            <span className="text-sm font-semibold text-slate-700 leading-tight">{row.teacher_name}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">Kode: {row.teacher_code}</span>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                                {row.teacher_code || "-"}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 italic">(Kode Guru)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {row.date}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`px-3 py-1 rounded-lg border uppercase tracking-wider text-[10px] ${getStatusStyle(row.status)}`}>
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Search className="w-12 h-12 opacity-10" />
                                                <p className="font-medium">Tidak ada data presensi yang ditemukan.</p>
                                                <p className="text-xs">Coba ubah filter atau periode tanggal Anda.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                
                {filteredData.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                        <p>Menampilkan {filteredData.length} entri presensi</p>
                        <p>Data terakhir diperbarui: {new Date().toLocaleTimeString()}</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
