"use client";

import { useState } from "react";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "sonner";
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
    School,
    Users,
    PenSquare,
    Trash2,
    Plus,
    Upload,
    FileSpreadsheet,
    MessageCircle,
    Eye,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Award,
    GraduationCap,
    Loader2
} from "lucide-react";

const INITIAL_CLASSES = [
    { id: "c1", grade: "7", name: "7A", teacher: "Budi Santoso", count: 32, status: "Aman" },
    { id: "c2", grade: "7", name: "7B", teacher: "Siti Rahayu", count: 31, status: "Warning" },
    { id: "c3", grade: "8", name: "8A", teacher: "Ahmad Fauzi", count: 30, status: "Aman" },
    { id: "c4", grade: "9", name: "9A", teacher: "Dewi Lestari", count: 29, status: "Aman" },
];

export default function AdminKelasPage() {
    const [classes, setClasses] = useState(INITIAL_CLASSES);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: "", grade: "7", name: "", teacher: "" });

    // Kenaikan Kelas State
    const [kenaikanFrom, setKenaikanFrom] = useState("");
    const [kenaikanTo, setKenaikanTo] = useState("");
    const [isPromoting, setIsPromoting] = useState(false);

    const handleOpenDialog = (data = { id: "", grade: "7", name: "", teacher: "" }) => {
        setFormData(data);
        setEditMode(!!data.id);
        setIsDialogOpen(true);
    };

    const handleSaveClass = () => {
        if (!formData.name || !formData.teacher) return toast.error("Isi semua data kelas");

        if (editMode) {
            setClasses(classes.map(c => c.id === formData.id ? { ...c, ...formData } : c));
            toast.success("Kelas berhasil diperbarui");
        } else {
            const newClass = {
                ...formData,
                id: `c${Date.now()}`,
                count: 0,
                status: "Aman"
            };
            setClasses([...classes, newClass]);
            toast.success("Kelas berhasil ditambahkan");
        }
        setIsDialogOpen(false);
    };

    const handleDeleteClass = (id: string, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus kelas ${name}?`)) {
            setClasses(classes.filter(c => c.id !== id));
            toast.success(`Kelas ${name} dihapus.`);
        }
    };

    const handleExport = () => {
        const worksheet = xlsx.utils.json_to_sheet(classes);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data_Kelas");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(data, "Data_Kelas.xlsx");
        toast.success("Data berhasil diekspor");
    };

    const handlePromotion = () => {
        if (!kenaikanFrom || !kenaikanTo) return toast.error("Pilih kelas asal dan tujuan");
        setIsPromoting(true);
        setTimeout(() => {
            setIsPromoting(false);
            toast.success(`Berhasil memindahkan siswa dari ${kenaikanFrom.toUpperCase()} ke ${kenaikanTo.toUpperCase()}`);
            setKenaikanFrom("");
            setKenaikanTo("");
        }, 1500);
    };

    const handleGraduation = () => {
        if (window.confirm("Ini akan menonaktifkan seluruh siswa Kelas 9 menjadi Alumni. Lanjutkan?")) {
            setIsPromoting(true);
            setTimeout(() => {
                setIsPromoting(false);
                toast.success("Proses kelulusan selesai. Data siswa kelas 9 dipindahkan ke arsip alumni.");
            }, 1500);
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Kelas</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Pusat kendali data kelas, siswa, dan monitoring presensi SIPANDU.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button onClick={handleExport} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Kelas
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editMode ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
                                <DialogDescription>
                                    Formulir informasi kelas untuk tahun ajaran aktif.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="level" className="text-right">Tingkat</Label>
                                    <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Pilih Tingkat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Kelas 7</SelectItem>
                                            <SelectItem value="8">Kelas 8</SelectItem>
                                            <SelectItem value="9">Kelas 9</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Nama</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} id="name" placeholder="Contoh: 7A, 9C" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="wali" className="text-right">Wali Kelas</Label>
                                    <Select value={formData.teacher} onValueChange={(v) => setFormData({ ...formData, teacher: v })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Pilih Guru" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Budi Santoso">Budi Santoso</SelectItem>
                                            <SelectItem value="Siti Rahayu">Siti Rahayu</SelectItem>
                                            <SelectItem value="Ahmad Fauzi">Ahmad Fauzi</SelectItem>
                                            <SelectItem value="Dewi Lestari">Dewi Lestari</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveClass} className="bg-[#000080] text-white py-2">Simpan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-1 md:grid-cols-2 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="list" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-6 font-bold h-10 w-full">
                        <School className="w-4 h-4 mr-2" />
                        Daftar Kelas
                    </TabsTrigger>
                    <TabsTrigger value="monitor" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-6 font-bold h-10">
                        <Eye className="w-4 h-4 mr-2" />
                        Monitoring (Real-Time)
                    </TabsTrigger>
                    <TabsTrigger value="promotion" className="hidden md:flex data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-6 font-bold h-10">
                        <Award className="w-4 h-4 mr-2" />
                        Kenaikan Kelas
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: DAFTAR KELAS & SISWA */}
                <TabsContent value="list" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                            <CardTitle className="text-[#000080] text-lg font-bold">Master Data Kelas</CardTitle>
                            <CardDescription>Kelola data kelas, wali kelas, dan jumlah siswa.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold text-[#000080]">Tingkat</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Nama Kelas</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Wali Kelas</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-center">Jumlah Siswa</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Status Hari Ini</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((cls) => (
                                        <TableRow key={cls.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-slate-700">Kelas {cls.grade}</TableCell>
                                            <TableCell className="font-bold text-slate-800 text-base">{cls.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {cls.teacher.charAt(0)}
                                                    </div>
                                                    <span className="text-slate-600 font-medium">{cls.teacher}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-slate-700">{cls.count}</TableCell>
                                            <TableCell>
                                                {cls.status === "Aman" ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Lengkap
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 shadow-none">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> Belum Absen
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button onClick={() => handleOpenDialog(cls)} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <PenSquare className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDeleteClass(cls.id, cls.name)} size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: MONITORING HARI INI */}
                <TabsContent value="monitor" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sudah Presensi</p>
                                    <p className="text-2xl font-black text-slate-800">12 <span className="text-sm font-medium text-slate-400">/ 15 Kelas</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Belum Presensi</p>
                                    <p className="text-2xl font-black text-slate-800">3 <span className="text-sm font-medium text-slate-400">Kelas</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: "7A", mapel: "Matematika", guru: "Budi Santoso", status: "DONE", time: "07:00 - 08:30" },
                            { name: "7B", mapel: "B. Inggris", guru: "Siti Rahayu", status: "PENDING", time: "07:00 - 08:30" }
                        ].map((cls, idx) => (
                            <Card key={idx} className={`border-l-4 shadow-sm rounded-xl overflow-hidden ${cls.status === "DONE" ? "border-l-emerald-500" : "border-l-red-500"}`}>
                                <CardHeader className="bg-white border-b border-slate-100 p-4 flex flex-row justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-black text-slate-800">{cls.name}</CardTitle>
                                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> 32 Siswa
                                        </p>
                                    </div>
                                    <Badge className={`${cls.status === "DONE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} border-0 shadow-none`}>
                                        {cls.status === "DONE" ? "Selesai" : "Belum Absen"}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 bg-slate-50/50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Mapel:</span>
                                        <span className="font-bold text-slate-800">{cls.mapel}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Guru:</span>
                                        <span className="font-bold text-slate-800">{cls.guru}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Jam:</span>
                                        <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">{cls.time}</span>
                                    </div>

                                    {cls.status === "DONE" && (
                                        <div className="pt-2 border-t border-slate-200 mt-2">
                                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide">Jurnal Guru:</p>
                                            <p className="text-xs text-slate-600 italic line-clamp-2">"Membahas Bab 4 tentang Aljabar Linear."</p>
                                        </div>
                                    )}

                                    {cls.status === "PENDING" && (
                                        <div className="pt-4">
                                            <Button onClick={() => toast.success(`Pesan peringatan telah dikirim ke WhatsApp ${cls.guru}.`)} size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-8 text-xs shadow-red-200 shadow-md">
                                                <MessageCircle className="w-3 h-3 mr-1" /> Ingatkan Guru
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* TAB 3: PROMOSI KELAS (KENAIKAN KELAS) */}
                <TabsContent value="promotion" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-xl">
                        <CardHeader className="bg-amber-50 border-b border-amber-100 px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div>
                                    <CardTitle className="text-amber-900 text-lg font-bold flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        Manajemen Kenaikan Kelas
                                    </CardTitle>
                                    <CardDescription className="text-amber-700/80">Fitur ini digunakan saat akhir semester genap.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="max-w-xl mx-auto space-y-6">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-4">
                                    <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Pindah Kelas Masal</h3>
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Dari Kelas</Label>
                                            <Select value={kenaikanFrom} onValueChange={setKenaikanFrom}>
                                                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                                <SelectContent>
                                                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex justify-center pt-6">
                                            <ArrowRight className="text-slate-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Ke Kelas</Label>
                                            <Select value={kenaikanTo} onValueChange={setKenaikanTo}>
                                                <SelectTrigger><SelectValue placeholder="Pilih Target" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="8A">8A</SelectItem>
                                                    <SelectItem value="8B">8B</SelectItem>
                                                    <SelectItem value="9A">9A</SelectItem>
                                                    <SelectItem value="alumni">Lulus / Alumni</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button disabled={isPromoting} onClick={handlePromotion} className="w-full bg-[#000080] text-white font-bold h-10 shadow-lg shadow-blue-900/10 hover:bg-[#000060]">
                                        {isPromoting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proses Pindah Kelas (Bulk Update)"}
                                    </Button>
                                </div>

                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-left space-y-4">
                                    <h3 className="font-bold text-red-800 border-b border-red-200 pb-2 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> Kelulusan Kelas 9
                                    </h3>
                                    <p className="text-sm text-red-700">
                                        Proses ini akan menonaktifkan siswa kelas 9 dan memindahkannya ke arsip alumni.
                                    </p>
                                    <Button disabled={isPromoting} onClick={handleGraduation} variant="destructive" className="w-full font-bold shadow-lg shadow-red-900/10">
                                        {isPromoting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proses Kelulusan Siswa"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
