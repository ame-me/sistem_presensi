"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    UserCog,
    BarChart3,
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    FileSpreadsheet,
    MessageCircle,
    UserCheck,
    Briefcase,
    Shield,
    Clock,
    MoreHorizontal,
    Loader2
} from "lucide-react";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminGuruPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    const [guruData, setGuruData] = useState([
        { id: "1", name: "Drs. Budi Santoso", nip: "198501012010011001", mapel: "Matematika", role: "WALI KELAS 7A", status: "AKTIF", phone: "6281234567890", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" },
        { id: "2", name: "Siti Aminah, S.Pd", nip: "199002022015022002", mapel: "B. Indonesia", role: "GURU MAPEL", status: "AKTIF", phone: "6281298765432", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
        { id: "3", name: "Ahmad Fauzi, S.Si", nip: "199203032018031003", mapel: "IPA", role: "WALI KELAS 8A", status: "CUTI", phone: "6281345678901", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad" },
        { id: "4", name: "Dewi Lestari, S.Pd", nip: "198804042012042004", mapel: "B. Inggris", role: "GURU BK", status: "AKTIF", phone: "6281456789012", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi" }
    ]);

    const filteredGuru = guruData.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.nip.includes(searchQuery)
    );

    const [editingGuru, setEditingGuru] = useState<any>(null);
    const [resetConfirmGuru, setResetConfirmGuru] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Piket State
    const [isAddPiketOpen, setIsAddPiketOpen] = useState(false);
    const [piketData, setPiketData] = useState<any[]>([
        { id: "p1", name: "Bpk. Supriyanto, S.Pd", mapel: "Guru PJOK", startTime: "07:00", endTime: "14:00", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Piket", notes: "" }
    ]);
    const [piketSelectedGuru, setPiketSelectedGuru] = useState<string>("");
    const [piketStartTime, setPiketStartTime] = useState<string>("");
    const [piketEndTime, setPiketEndTime] = useState<string>("");
    const [piketNotes, setPiketNotes] = useState<string>("");

    const handleSavePiket = () => {
        if (!piketSelectedGuru || !piketStartTime || !piketEndTime) {
            toast.error("Mohon pilih guru dan lengkapi waktu penugasan!");
            return;
        }

        const guru = guruData.find(g => g.id === piketSelectedGuru);
        if (guru) {
            const newPiket = {
                id: `p${Date.now()}`,
                name: guru.name,
                mapel: guru.mapel,
                startTime: piketStartTime,
                endTime: piketEndTime,
                img: guru.img,
                notes: piketNotes
            };
            setPiketData([...piketData, newPiket]);
            setIsAddPiketOpen(false);
            setPiketSelectedGuru("");
            setPiketStartTime("");
            setPiketEndTime("");
            setPiketNotes("");

            toast.success(`Hak akses sementara diberikan kepada ${guru.name}`);
            toast.success(`Notifikasi WhatsApp terkirim via Fontee!`);
        }
    };

    const handleAction = (action: string, id: string, name: string) => {
        const guru = guruData.find(g => g.id === id);
        if (action === "nonaktif") {
            setGuruData(prev => prev.map(g => g.id === id ? { ...g, status: "NONAKTIF" } : g));
            toast.success(`Akun ${name} berhasil dinonaktifkan!`);
        } else if (action === "Edit Data" && guru) {
            setEditingGuru(guru);
        } else if (action === "Reset Password" && guru) {
            setResetConfirmGuru(guru);
        }
        setOpenDialogId(null);
    };

    const handleSaveEdit = () => {
        setIsSaving(true);
        setTimeout(() => {
            setGuruData(prev => prev.map(g => g.id === editingGuru.id ? editingGuru : g));
            setIsSaving(false);
            setEditingGuru(null);
            toast.success(`Data Guru ${editingGuru.name} Berhasil Diperbarui!`);
        }, 1000);
    };

    const handleConfirmReset = () => {
        toast.success(`Password baru untuk ${resetConfirmGuru.name} telah dikirim via WhatsApp!`);
        setResetConfirmGuru(null);
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Guru & SDM</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Kelola data guru, penugasan, dan monitoring kinerja akademik.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Guru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Tambah Guru Baru</DialogTitle>
                                <DialogDescription>Masukkan data lengkap tenaga pengajar baru.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nip">NIP / NIK</Label>
                                        <Input id="nip" placeholder="1985xxxxxx" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap (Gelar)</Label>
                                        <Input id="name" placeholder="Drs. Budi Santoso, M.Pd" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mapel">Mapel Utama</Label>
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mtk">Matematika</SelectItem>
                                                <SelectItem value="indo">B. Indonesia</SelectItem>
                                                <SelectItem value="ipa">IPA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">No. WhatsApp (Aktif)</Label>
                                        <Input id="phone" placeholder="0812xxxxxx" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role & Hak Akses</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GURU">Guru Mapel (Standard)</SelectItem>
                                            <SelectItem value="WALI">Wali Kelas (Extra Access)</SelectItem>
                                            <SelectItem value="BK">Guru BK / Tata Tertib</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className="bg-[#000080] text-white">Simpan Data Guru</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div >

            <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-1 md:grid-cols-3 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="list" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Data Guru
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Penugasan
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Monitoring & Kinerja
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: DATA GURU */}
                <TabsContent value="list" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari Nama / NIP..." className="pl-9 bg-white border-slate-200 w-full" />
                                </div>
                                <Select defaultValue="all">
                                    <SelectTrigger className="w-full md:w-48 bg-white border-slate-200"><SelectValue placeholder="Semua Role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Role</SelectItem>
                                        <SelectItem value="wali">Wali Kelas</SelectItem>
                                        <SelectItem value="bk">Guru BK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-slate-500 italic hidden md:block">
                                Menampilkan <b>{filteredGuru.length}</b> Guru Aktif
                            </div>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-[#000080]">Nama Guru</TableHead>
                                    <TableHead className="font-bold text-[#000080]">NIP / NIK</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Mapel Utama</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Role & Akses</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Status</TableHead>
                                    <TableHead className="font-bold text-[#000080]">Kontak</TableHead>
                                    <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGuru.map((guru, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={guru.img} />
                                                    <AvatarFallback>{guru.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{guru.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs text-slate-500 font-mono">{guru.nip}</p>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700 whitespace-nowrap">{guru.mapel}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="w-fit text-[10px] border-blue-200 text-blue-700 bg-blue-50 whitespace-nowrap">
                                                {guru.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <div className={`w-2 h-2 rounded-full ${guru.status === 'AKTIF' ? 'bg-emerald-500' : guru.status === 'CUTI' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                <span className={`text-[10px] font-bold ${guru.status === 'NONAKTIF' ? 'text-red-600' : 'text-slate-500'}`}>{guru.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-medium text-slate-600">+{guru.phone}</span>
                                                <Link href={`https://wa.me/${guru.phone}?text=Halo Bapak/Ibu ${guru.name},`} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="h-6 text-[10px] text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 px-2 w-fit">
                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                        Chat WA
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button size="icon" variant="outline" className="h-7 w-7 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700" title="Edit Data" onClick={() => handleAction("Edit Data", guru.id, guru.name)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-7 w-7 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700" title="Reset Password" onClick={() => handleAction("Reset Password", guru.id, guru.name)}>
                                                    <UserCog className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-7 w-7 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700" title="Nonaktifkan" onClick={() => handleAction("nonaktif", guru.id, guru.name)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* TAB 2: PENUGASAN */}
                <TabsContent value="assignment" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden mb-6">
                        <CardHeader className="bg-amber-50 border-b border-amber-100 px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="text-amber-900 text-lg font-bold flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Guru Piket Hari Ini
                                    </CardTitle>
                                    <CardDescription className="text-amber-700/80">Petugas yang bertanggung jawab menggantikan guru berhalangan.</CardDescription>
                                </div>
                                <Dialog open={isAddPiketOpen} onOpenChange={setIsAddPiketOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm">
                                            <Plus className="w-4 h-4 mr-2" /> Tambah Piket
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>Tugaskan Guru Piket</DialogTitle>
                                            <DialogDescription>Beri wewenang akses presensi sementara untuk guru pengganti.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Pilih Guru</Label>
                                                <Select value={piketSelectedGuru} onValueChange={setPiketSelectedGuru}>
                                                    <SelectTrigger><SelectValue placeholder="-- Pilih Guru --" /></SelectTrigger>
                                                    <SelectContent>
                                                        {guruData.filter(g => g.status === 'AKTIF').map(g => (
                                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Jam Mulai</Label>
                                                    <Input type="time" value={piketStartTime} onChange={e => setPiketStartTime(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Jam Selesai</Label>
                                                    <Input type="time" value={piketEndTime} onChange={e => setPiketEndTime(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Keterangan Tambahan (Opsional)</Label>
                                                <Input placeholder="Menggantikan Guru A yang sakit..." value={piketNotes} onChange={e => setPiketNotes(e.target.value)} />
                                            </div>
                                        </div>
                                        <DialogFooter className="gap-2 sm:gap-0 mt-2">
                                            <Button variant="outline" onClick={() => setIsAddPiketOpen(false)}>Batal</Button>
                                            <Button className="bg-[#000080]" onClick={handleSavePiket}>Simpan/Tugaskan</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {piketData.map(piket => (
                                    <div key={piket.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-amber-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-amber-100">
                                                <AvatarImage src={piket.img} />
                                                <AvatarFallback>GP</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-800">{piket.name}</p>
                                                <p className="text-xs text-slate-500 font-medium my-0.5">{piket.mapel} • Piket Jam {piket.startTime} - {piket.endTime}</p>
                                                {piket.notes && <p className="text-[10px] text-slate-400 italic">"{piket.notes}"</p>}
                                            </div>
                                        </div>
                                        <div className="sm:ml-auto">
                                            <Badge className="bg-green-100 text-green-700 border-none w-fit">Sedang Bertugas</Badge>
                                        </div>
                                    </div>
                                ))}
                                {piketData.length === 0 && (
                                    <div className="text-center text-slate-500 py-4">Belum ada guru piket yang ditugaskan hari ini.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Wali Kelas (Homeroom)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kelas</TableHead>
                                            <TableHead>Wali Kelas</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { cls: "7A", teacher: "Drs. Budi Santoso" },
                                            { cls: "7B", teacher: "Siti Rahayu, S.Pd" },
                                            { cls: "8A", teacher: "Ahmad Fauzi, S.Si" },
                                        ].map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-black text-slate-700">{item.cls}</TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600">{item.teacher}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600">Ganti</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Mapping Pengajaran</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm text-slate-700">Drs. Budi Santoso</span>
                                        <Badge variant="outline" className="text-[10px]">Matematika</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {["7A", "7B", "8A", "8B"].map((c) => (
                                            <span key={c} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded font-medium shadow-sm">{c}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm text-slate-700">Siti Aminah, S.Pd</span>
                                        <Badge variant="outline" className="text-[10px]">B. Indonesia</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {["9A", "9B", "9C"].map((c) => (
                                            <span key={c} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded font-medium shadow-sm">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: MONITORING & KINERJA */}
                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                                <UserCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800">92%</h3>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Tingkat Disiplin</p>
                            <span className="text-xs text-emerald-600 font-medium mt-2">+2.4% dari bulan lalu</span>
                        </Card>
                        <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800">24 Jam</h3>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Total Jam Mengajar</p>
                            <span className="text-xs text-blue-600 font-medium mt-2">Rata-rata per minggu</span>
                        </Card>
                        <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                                <UserCog className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800">3</h3>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Guru Jarang Absen</p>
                            <span className="text-xs text-red-600 font-medium mt-2">Perlu pembinaan</span>
                        </Card>
                    </div>

                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                            <CardTitle className="text-[#000080] text-lg font-bold">Audit Presensi Guru (Bulan Ini)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold text-[#000080]">Nama Guru</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-center">Jml Masuk</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-center">Tepat Waktu</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-center">Terlambat Absen</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Terakhir Aktif</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { name: "Drs. Budi Santoso", total: 42, ontime: 40, late: 2, last: "Hari ini, 07:15", score: 95 },
                                        { name: "Siti Aminah, S.Pd", total: 38, ontime: 30, late: 8, last: "Hari ini, 09:00", score: 78 },
                                        { name: "Joko Anwar, S.Kom", total: 40, ontime: 40, late: 0, last: "Hari ini, 07:05", score: 100 },
                                    ].map((stats, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold text-slate-700">{stats.name}</TableCell>
                                            <TableCell className="text-center font-medium">{stats.total} Jam</TableCell>
                                            <TableCell className="text-center font-bold text-emerald-600">{stats.ontime}</TableCell>
                                            <TableCell className="text-center font-bold text-amber-600">{stats.late}</TableCell>
                                            <TableCell className="text-xs font-mono text-slate-500">{stats.last}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={
                                                        stats.score >= 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                            stats.score >= 75 ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                                "bg-red-100 text-red-700 border-red-200"
                                                    }
                                                >
                                                    {stats.score}% (Sangat Baik)
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit User Modal */}
            <Dialog open={!!editingGuru} onOpenChange={(open) => !open && setEditingGuru(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data Guru</DialogTitle>
                        <DialogDescription>Perbarui informasi untuk {editingGuru?.name}</DialogDescription>
                    </DialogHeader>
                    {editingGuru && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-nip">NIP / NIK</Label>
                                    <Input id="edit-nip" value={editingGuru.nip} onChange={e => setEditingGuru({ ...editingGuru, nip: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nama Lengkap (Gelar)</Label>
                                    <Input id="edit-name" value={editingGuru.name} onChange={e => setEditingGuru({ ...editingGuru, name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-mapel">Mapel Utama</Label>
                                    <Select value={editingGuru.mapel} onValueChange={val => setEditingGuru({ ...editingGuru, mapel: val })}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Matematika">Matematika</SelectItem>
                                            <SelectItem value="B. Indonesia">B. Indonesia</SelectItem>
                                            <SelectItem value="IPA">IPA</SelectItem>
                                            <SelectItem value="B. Inggris">B. Inggris</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">No. WhatsApp (Aktif)</Label>
                                    <Input id="edit-phone" value={editingGuru.phone} onChange={e => setEditingGuru({ ...editingGuru, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role & Hak Akses</Label>
                                    <Select value={editingGuru.role} onValueChange={val => setEditingGuru({ ...editingGuru, role: val })}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GURU MAPEL">Guru Mapel</SelectItem>
                                            <SelectItem value="WALI KELAS 7A">WALI KELAS 7A</SelectItem>
                                            <SelectItem value="WALI KELAS 8A">WALI KELAS 8A</SelectItem>
                                            <SelectItem value="GURU BK">GURU BK</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={editingGuru.status} onValueChange={val => setEditingGuru({ ...editingGuru, status: val })}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AKTIF">AKTIF</SelectItem>
                                            <SelectItem value="CUTI">CUTI</SelectItem>
                                            <SelectItem value="NONAKTIF">NONAKTIF</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button className="bg-[#000080] text-white w-full sm:w-auto" onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Confirm Modal */}
            <Dialog open={!!resetConfirmGuru} onOpenChange={(open) => !open && setResetConfirmGuru(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Reset Password</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mereset password untuk guru <b className="text-slate-700">{resetConfirmGuru?.name}</b>?
                            Password baru akan dikirimkan secara otomatis melalui WhatsApp ke nomor yang terdaftar.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setResetConfirmGuru(null)}>Batal</Button>
                        <Button variant="destructive" onClick={handleConfirmReset}>Ya, Reset Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div >
    );
}
