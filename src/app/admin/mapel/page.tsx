"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BookOpen,
    Calendar,
    Clock,
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    Copy,
    Bell,
    User,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function AdminMapelPage() {
    const [selectedClass, setSelectedClass] = useState("7A");
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // State untuk form Tambah Mapel
    const [newMapelName, setNewMapelName] = useState("");
    const [newMapelCode, setNewMapelCode] = useState("");
    const [newMapelCat, setNewMapelCat] = useState("");

    const [mapelList, setMapelList] = useState([
        { code: "MTK", name: "Matematika", cat: "Umum", teachers: ["Budi S.", "Siti A."] },
        { code: "IND", name: "Bahasa Indonesia", cat: "Umum", teachers: ["Rina M."] },
        { code: "IPA", name: "Ilmu Pengetahuan Alam", cat: "Umum", teachers: ["Ahmad F.", "Dewi L."] },
        { code: "SBK", name: "Seni Budaya", cat: "Muatan Lokal", teachers: ["Joko P."] },
        { code: "PMR", name: "Palang Merah Remaja", cat: "Ekstrakurikuler", teachers: ["Sari W."] },
    ]);

    useEffect(() => {
        setIsLoadingJadwal(true);
        // Simulate fetch schedule when class changes
        const timer = setTimeout(() => {
            setIsLoadingJadwal(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [selectedClass]);

    const handleRemindTeacher = (mapel: string) => {
        // Trigger WA message via "API Fontee" simulation
        toast.success(`Pesan pengingat dikirim ke pengampu ${mapel} (Via Fontee API)`);
    };

    const handleSave = () => {
        if (!newMapelName || !newMapelCode || !newMapelCat) {
            toast.error("Mohon lengkapi semua data mata pelajaran!");
            return;
        }

        const categoryLabel = newMapelCat === "umum" ? "Umum" : newMapelCat === "lokal" ? "Muatan Lokal" : "Ekstrakurikuler";

        const newMapel = {
            code: newMapelCode,
            name: newMapelName,
            cat: categoryLabel,
            teachers: []
        };

        setMapelList([newMapel, ...mapelList]);
        toast.success("Mata pelajaran berhasil ditambahkan!");
        setIsAddOpen(false);
        setNewMapelName("");
        setNewMapelCode("");
        setNewMapelCat("");
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Mata Pelajaran & Jadwal</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Kelola katalog mata pelajaran, plotting guru, dan konfigurasi jadwal sistem.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Jadwal
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Mapel
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Mata Pelajaran</DialogTitle>
                                <DialogDescription>Tambahkan mata pelajaran baru ke dalam katalog sekolah.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Mata Pelajaran</Label>
                                    <Input id="name" placeholder="Contoh: Matematika Wajib" value={newMapelName} onChange={(e) => setNewMapelName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Kode Mapel</Label>
                                    <Input id="code" placeholder="Contoh: MTK-W" value={newMapelCode} onChange={(e) => setNewMapelCode(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Kategori</Label>
                                    <Select value={newMapelCat} onValueChange={setNewMapelCat}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="umum">Muatan Nasional (Umum)</SelectItem>
                                            <SelectItem value="lokal">Muatan Lokal</SelectItem>
                                            <SelectItem value="ekskul">Ekstrakurikuler</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className="bg-[#000080] text-white hover:bg-[#000060]" onClick={handleSave}>Simpan Data</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="catalog" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-1 md:grid-cols-3 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="catalog" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Katalog Mapel
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <Calendar className="w-4 h-4 mr-2" />
                        Jadwal Pelajaran
                    </TabsTrigger>
                    <TabsTrigger value="report" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Laporan & Analitik
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: KATALOG MAPEL */}
                <TabsContent value="catalog" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar Stats */}
                        <div className="space-y-4">
                            <Card className="bg-blue-50 border-blue-100 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Mapel</p>
                                    <p className="text-2xl font-black text-[#000080]">24 <span className="text-sm font-medium text-blue-400">Mapel</span></p>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Guru Mapel</p>
                                    <p className="text-2xl font-black text-emerald-800">42 <span className="text-sm font-medium text-emerald-500">Guru</span></p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        <Card className="md:col-span-3 border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Cari Mapel..." className="pl-9 bg-white border-slate-200 w-full" />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button variant="outline" size="sm" className="w-full md:w-auto text-xs h-8"><Filter className="w-3 h-3 mr-1" /> Filter</Button>
                                </div>
                            </div>
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold text-[#000080]">Kode</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Mata Pelajaran</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Kategori</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Guru Pengampu</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mapelList.map((m, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs font-bold text-slate-500">{m.code}</TableCell>
                                            <TableCell className="font-bold text-slate-800">{m.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                                                    {m.cat}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center -space-x-2">
                                                    {m.teachers.map((t, idx) => (
                                                        <div key={idx} className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-blue-700" title={t}>
                                                            {t.charAt(0)}
                                                        </div>
                                                    ))}
                                                    <span className="ml-3 text-xs text-slate-500 font-medium">{m.teachers.length} Guru</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50"><Edit2 className="w-4 h-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: JADWAL PELAJARAN */}
                <TabsContent value="schedule" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Konfigurasi Jadwal Pelajaran
                                </CardTitle>
                                <CardDescription>Sistem akan otomatis mendeteksi jam pelajaran aktif berdasarkan pengaturan ini.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full sm:w-32 bg-white"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7A">Kelas 7A</SelectItem>
                                        <SelectItem value="7B">Kelas 7B</SelectItem>
                                        <SelectItem value="8A">Kelas 8A</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="w-full sm:w-auto text-slate-600">
                                    <Copy className="w-4 h-4 mr-2" />
                                    Salin Jadwal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-20 font-bold text-center text-slate-400 bg-slate-50">JAM</TableHead>
                                            <TableHead className="text-center font-bold text-[#000080] bg-blue-50/30">SENIN</TableHead>
                                            <TableHead className="text-center font-bold text-[#000080] bg-blue-50/30">SELASA</TableHead>
                                            <TableHead className="text-center font-bold text-[#000080] bg-blue-50/30">RABU</TableHead>
                                            <TableHead className="text-center font-bold text-[#000080] bg-blue-50/30">KAMIS</TableHead>
                                            <TableHead className="text-center font-bold text-[#000080] bg-blue-50/30">JUMAT</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { jam: "1", time: "07:00 - 07:40" },
                                            { jam: "2", time: "07:40 - 08:20" },
                                            { jam: "3", time: "08:20 - 09:00" },
                                            { jam: "IST", time: "09:00 - 09:15", type: "BREAK" },
                                            { jam: "4", time: "09:15 - 09:55" },
                                            { jam: "5", time: "09:55 - 10:35" },
                                        ].map((slot, i) => (
                                            <TableRow key={i} className={slot.type === 'BREAK' ? "bg-slate-50 hover:bg-slate-50" : ""}>
                                                <TableCell className="text-center border-r border-slate-100 bg-slate-50">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-slate-700">{slot.jam}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{slot.time}</span>
                                                    </div>
                                                </TableCell>
                                                {slot.type === 'BREAK' ? (
                                                    <TableCell colSpan={5} className="text-center py-3">
                                                        <span className="inline-flex items-center px-4 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest">
                                                            Istirahat
                                                        </span>
                                                    </TableCell>
                                                ) : (
                                                    <>
                                                        {isLoadingJadwal ? (
                                                            [1, 2, 3, 4, 5].map((_, idx) => (
                                                                <TableCell key={idx} className="p-2 border-r border-slate-50 last:border-0 align-top">
                                                                    <div className="bg-slate-100 animate-pulse h-12 w-full rounded-lg"></div>
                                                                </TableCell>
                                                            ))
                                                        ) : (
                                                            ["Matematika (Budi)", "B. Indo (Siti)", "IPA (Ahmad)", "IPS (Rina)", "PJOK (Doni)"].map((sub, j) => (
                                                                <TableCell key={j} className="p-2 border-r border-slate-50 last:border-0 align-top">
                                                                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm hover:border-[#000080] hover:shadow-md transition-all cursor-pointer group group-hover:bg-blue-50/10 h-full">
                                                                        <p className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-[#000080]">{selectedClass} - {sub.split('(')[0]}</p>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <User className="w-3 h-3 text-slate-400" />
                                                                            <p className="text-[10px] text-slate-500">{sub.split('(')[1].replace(')', '')}</p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            ))
                                                        )}
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: LAPORAN & ANALITIK */}
                <TabsContent value="report" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Audit Presensi Guru */}
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-white px-6 py-4 border-b border-slate-100">
                                <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    Audit Presensi Guru Hari Ini
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {[
                                        { mapel: "7A - Matematika", time: "07:15", status: "Terlambat 15m", color: "text-amber-600" },
                                        { mapel: "8B - B. Inggris", time: "-", status: "Belum Absen", color: "text-red-600" },
                                        { mapel: "9C - IPA", time: "07:05", status: "Tepat Waktu", color: "text-emerald-600" },
                                    ].map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{log.mapel}</p>
                                                <p className={`text-xs font-bold ${log.color}`}>{log.status}</p>
                                            </div>
                                            {log.status === "Belum Absen" ? (
                                                <Button onClick={() => handleRemindTeacher(log.mapel)} size="sm" variant="destructive" className="h-7 text-xs shadow-red-100">
                                                    <Bell className="w-3 h-3 mr-1" /> Ingatkan
                                                </Button>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-400">{log.time}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Alpha Mapel */}
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-white px-6 py-4 border-b border-slate-100">
                                <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    Mapel dengan Alpha Tertinggi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {[
                                        { name: "Matematika", count: 12, pct: 85 },
                                        { name: "Sejarah", count: 8, pct: 60 },
                                        { name: "Fisika", count: 5, pct: 40 },
                                    ].map((m, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold text-slate-700">{m.name}</span>
                                                <span className="font-bold text-red-600">{m.count} Siswa Alpha</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${m.pct}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <Link href="/admin/mapel/analitik">
                                        <Button variant="outline" className="w-full text-xs font-bold text-slate-600">
                                            Lihat Analisa Lengkap
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
