"use client";

import { useState } from "react";
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
    UserPlus,
    Upload,
    Search,
    Filter,
    FileSpreadsheet,
    MessageCircle,
    Calendar,
    History,
    FileText,
    GraduationCap,
    ArrowUpRight,
    MoreHorizontal,
    Phone,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    Edit2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminSiswaPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const [siswaData, setSiswaData] = useState([
        { name: "Aditya Pratama", nisn: "0081234567", cls: "7A", parent: "Bpk. Suryono", wa: "628123456789", status: "ok" },
        { name: "Bunga Citra", nisn: "0082345678", cls: "7A", parent: "Ibu Melati", wa: "628134567890", status: "ok" },
        { name: "Chandra Wijaya", nisn: "0083456789", cls: "7B", parent: "Bpk. Wijaya", wa: "-", status: "fail" },
        { name: "Dinda Kirana", nisn: "0084567890", cls: "8A", parent: "Ibu Kartini", wa: "628156789012", status: "ok" }
    ]);

    const [isAddSiswaOpen, setIsAddSiswaOpen] = useState(false);
    const [newSiswaNisn, setNewSiswaNisn] = useState("");
    const [newSiswaNama, setNewSiswaNama] = useState("");
    const [newSiswaKelas, setNewSiswaKelas] = useState("");
    const [newSiswaGender, setNewSiswaGender] = useState("");
    const [newOrtuNama, setNewOrtuNama] = useState("");
    const [newOrtuWa, setNewOrtuWa] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Edit Siswa State
    const [editSiswa, setEditSiswa] = useState<any>(null);
    const [editSiswaNisn, setEditSiswaNisn] = useState("");
    const [editSiswaNama, setEditSiswaNama] = useState("");
    const [editSiswaKelas, setEditSiswaKelas] = useState("");
    const [editSiswaGender, setEditSiswaGender] = useState("");
    const [editOrtuNama, setEditOrtuNama] = useState("");
    const [editOrtuWa, setEditOrtuWa] = useState("");
    const [isEditSaving, setIsEditSaving] = useState(false);

    const [detailSiswa, setDetailSiswa] = useState<any>(null);
    const [filterKelas, setFilterKelas] = useState("all");

    // Dispensasi State
    const [dispensasiData, setDispensasiData] = useState([
        { name: "Dimas Anggara", cls: "8B", reason: "Lomba Basket Tingkat Kota", date: "2026-02-19 - 2026-02-21" },
        { name: "Eka Putri", cls: "9A", reason: "Persiapan Perpisahan (OSIS)", date: "2026-02-20" },
    ]);
    const [dispSiswaName, setDispSiswaName] = useState("");
    const [dispKeperluan, setDispKeperluan] = useState("");
    const [dispStartDate, setDispStartDate] = useState("");
    const [dispEndDate, setDispEndDate] = useState("");
    const [previewSurat, setPreviewSurat] = useState<any>(null);

    const filteredSiswa = siswaData.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery);
        const matchKelas = filterKelas === "all" ? true : s.cls.startsWith(filterKelas);
        return matchSearch && matchKelas;
    });

    const handleSaveSiswa = () => {
        if (!newSiswaNisn || !newSiswaNama || !newSiswaKelas || !newOrtuNama) {
            toast.error("Mohon lengkapi bagian NISN, Nama, Kelas, dan Nama Ortu!");
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            const newSiswa = {
                name: newSiswaNama,
                nisn: newSiswaNisn,
                cls: newSiswaKelas,
                parent: newOrtuNama,
                wa: newOrtuWa || "-",
                status: newOrtuWa && newOrtuWa.length > 5 ? "ok" : "fail"
            };
            setSiswaData([newSiswa, ...siswaData]);
            toast.success(`Data Siswa ${newSiswaNama} berhasil ditambahkan!`);
            setIsSaving(false);
            setIsAddSiswaOpen(false);

            setNewSiswaNisn("");
            setNewSiswaNama("");
            setNewSiswaKelas("");
            setNewSiswaGender("");
            setNewOrtuNama("");
            setNewOrtuWa("");
        }, 800);
    };

    const handleEditSiswaClick = (s: any) => {
        setEditSiswa(s);
        setEditSiswaNisn(s.nisn);
        setEditSiswaNama(s.name);
        setEditSiswaKelas(s.cls);
        setEditSiswaGender("L"); // default safe fallback if gender isn't recorded
        setEditOrtuNama(s.parent);
        setEditOrtuWa(s.wa !== "-" ? s.wa : "");
    };

    const handleSaveEditSiswa = () => {
        if (!editSiswaNisn || !editSiswaNama || !editSiswaKelas || !editOrtuNama) {
            toast.error("Mohon lengkapi bagian NISN, Nama, Kelas, dan Nama Ortu!");
            return;
        }

        setIsEditSaving(true);
        setTimeout(() => {
            const updatedSiswa = {
                ...editSiswa,
                name: editSiswaNama,
                nisn: editSiswaNisn,
                cls: editSiswaKelas,
                parent: editOrtuNama,
                wa: editOrtuWa || "-",
                status: editOrtuWa && editOrtuWa.length > 5 ? "ok" : "fail"
            };

            setSiswaData(prev => prev.map(s => s.nisn === editSiswa.nisn ? updatedSiswa : s));
            toast.success(`Data Siswa ${editSiswaNama} berhasil diperbarui!`);

            setIsEditSaving(false);
            setEditSiswa(null);
        }, 800);
    };

    const handleMakeSurat = () => {
        if (!dispSiswaName || !dispKeperluan || !dispStartDate) {
            toast.error("Mohon isi Nama, Keperluan, dan setidaknya Tanggal Mulai!");
            return;
        }
        setPreviewSurat({
            name: dispSiswaName,
            cls: "Terlampir", // Or try to search from siswaData
            reason: dispKeperluan,
            date: dispEndDate ? `${dispStartDate} s/d ${dispEndDate}` : dispStartDate
        });
    };

    const handlePrintSurat = () => {
        window.print(); // Opens browser print dialog to save as PDF
        setDispensasiData([{ ...previewSurat }, ...dispensasiData]);
        toast.success(`Surat dispensasi untuk ${previewSurat.name} berhasil diterbitkan dan dicatat!`);
        setPreviewSurat(null);
        setDispSiswaName("");
        setDispKeperluan("");
        setDispStartDate("");
        setDispEndDate("");
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Siswa</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Pusat data siswa, sinkronisasi orang tua, dan log kehadiran individual.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Excel
                    </Button>
                    <Dialog open={isAddSiswaOpen} onOpenChange={setIsAddSiswaOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Tambah Siswa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                                <DialogDescription>Masukkan data identitas siswa secara lengkap.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nisn">NISN</Label>
                                        <Input id="nisn" placeholder="001234xxxx" value={newSiswaNisn} onChange={e => setNewSiswaNisn(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nama">Nama Lengkap</Label>
                                        <Input id="nama" placeholder="Nama Siswa" value={newSiswaNama} onChange={e => setNewSiswaNama(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="kelas">Kelas</Label>
                                        <Select value={newSiswaKelas} onValueChange={setNewSiswaKelas}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7A">7A</SelectItem>
                                                <SelectItem value="7B">7B</SelectItem>
                                                <SelectItem value="8A">8A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Jenis Kelamin</Label>
                                        <Select value={newSiswaGender} onValueChange={setNewSiswaGender}>
                                            <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="L">Laki-laki</SelectItem>
                                                <SelectItem value="P">Perempuan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2 border-t pt-4 mt-2">
                                    <Label className="font-bold text-[#000080]">Data Orang Tua / Wali</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ortu_nama">Nama Ortu</Label>
                                            <Input id="ortu_nama" placeholder="Nama Ayah/Ibu" value={newOrtuNama} onChange={e => setNewOrtuNama(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ortu_wa">No. WhatsApp (Aktif)</Label>
                                            <Input id="ortu_wa" placeholder="081xxxx..." value={newOrtuWa} onChange={e => setNewOrtuWa(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className="bg-[#000080] text-white" onClick={handleSaveSiswa} disabled={isSaving}>
                                    {isSaving ? "Menyimpan..." : "Simpan Data Siswa"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="directory" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-2 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="directory" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Data Siswa
                    </TabsTrigger>
                    <TabsTrigger value="monitoring" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <History className="w-4 h-4 mr-2" />
                        Log & Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="dispensation" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <FileText className="w-4 h-4 mr-2" />
                        Dispensasi
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="hidden md:flex data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Alumni & Tools
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: DIRECTORY (DATA SISWA) */}
                <TabsContent value="directory" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar Filter */}
                        <div className="space-y-4">
                            <Card className="bg-white border-slate-200 shadow-sm">
                                <CardContent className="p-4 space-y-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Filter Kelas</Label>
                                        <Select value={filterKelas} onValueChange={setFilterKelas}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Kelas</SelectItem>
                                                <SelectItem value="7">Tingkat 7</SelectItem>
                                                <SelectItem value="8">Tingkat 8</SelectItem>
                                                <SelectItem value="9">Tingkat 9</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status Siswa</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="aktif" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                                <label htmlFor="aktif" className="text-sm font-medium text-slate-700">Aktif</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="mutasi" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <label htmlFor="mutasi" className="text-sm font-medium text-slate-700">Mutasi / Keluar</label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        <Card className="md:col-span-3 border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari Nama / NISN..." className="pl-9 bg-white border-slate-200 w-full" />
                                </div>
                                <div className="text-sm text-slate-500 italic hidden md:block w-full md:w-auto text-right">
                                    Total: <b>{filteredSiswa.length}</b> Siswa Aktif
                                </div>
                            </div>
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold text-[#000080]">Identitas Siswa</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Kelas</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Orang Tua / Wali</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-center">Status WA</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSiswa.map((s, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${s.name}`} />
                                                        <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">{s.nisn}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-700">
                                                <Badge variant="outline" className="bg-slate-50">{s.cls}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{s.parent}</span>
                                                    <span className="text-[10px] text-slate-400">Orang Tua / Wali</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {s.status === 'ok' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Terhubung
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none">
                                                        <XCircle className="w-3 h-3 mr-1" /> Invalid
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700" title="Lihat Detail" onClick={() => setDetailSiswa(s)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Link href={`https://wa.me/${s.wa}?text=Halo Bapak/Ibu ${s.parent},`} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700" title="Hubungi Ortu (WA)">
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700" title="Edit Data Siswa" onClick={() => handleEditSiswaClick(s)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Detail Siswa Modal */}
                        <Dialog open={!!detailSiswa} onOpenChange={(open) => !open && setDetailSiswa(null)}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Detail Profil & Log Siswa</DialogTitle>
                                    <DialogDescription>Informasi lengkap mengenai {detailSiswa?.name}</DialogDescription>
                                </DialogHeader>
                                {detailSiswa && (
                                    <div className="py-4">
                                        <div className="flex items-center gap-6 mb-6">
                                            <Avatar className="h-20 w-20 border-4 border-slate-100 shadow-sm">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${detailSiswa.name}`} />
                                                <AvatarFallback>{detailSiswa.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h2 className="text-2xl font-black text-[#000080]">{detailSiswa.name}</h2>
                                                <p className="text-sm text-slate-500 font-mono mt-1">NISN: {detailSiswa.nisn}</p>
                                                <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Kelas {detailSiswa.cls}</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Wali Murid</p>
                                                <p className="text-sm font-medium text-slate-800 mt-1">{detailSiswa.parent}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Nomor WhatsApp</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-medium text-slate-800">{detailSiswa.wa !== "-" ? `+${detailSiswa.wa}` : 'Belum Ditambahkan'}</p>
                                                    {detailSiswa.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="w-4 h-4" /> Riwayat Log Terbaru</h3>
                                            </div>
                                            <div className="p-4 bg-white text-center text-sm text-slate-500 italic py-8">
                                                Log detail siswa ini akan terisi otomatis seiring penggunaan absensi harian.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Edit Siswa Modal */}
                        <Dialog open={!!editSiswa} onOpenChange={(open) => !open && setEditSiswa(null)}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Edit Data Siswa</DialogTitle>
                                    <DialogDescription>Perbarui informasi identitas siswa dan wali murid.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_nisn">NISN</Label>
                                            <Input id="edit_nisn" value={editSiswaNisn} onChange={e => setEditSiswaNisn(e.target.value)} disabled className="bg-slate-50 cursor-not-allowed" title="NISN tidak dapat diubah" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_nama">Nama Lengkap</Label>
                                            <Input id="edit_nama" value={editSiswaNama} onChange={e => setEditSiswaNama(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_kelas">Kelas</Label>
                                            <Select value={editSiswaKelas} onValueChange={setEditSiswaKelas}>
                                                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="7A">7A</SelectItem>
                                                    <SelectItem value="7B">7B</SelectItem>
                                                    <SelectItem value="8A">8A</SelectItem>
                                                    <SelectItem value="8B">8B</SelectItem>
                                                    <SelectItem value="9A">9A</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_gender">Jenis Kelamin</Label>
                                            <Select value={editSiswaGender} onValueChange={setEditSiswaGender}>
                                                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="L">Laki-laki</SelectItem>
                                                    <SelectItem value="P">Perempuan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 border-t pt-4 mt-2">
                                        <Label className="font-bold text-[#000080]">Data Orang Tua / Wali</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ortu_nama">Nama Ortu</Label>
                                                <Input id="edit_ortu_nama" value={editOrtuNama} onChange={e => setEditOrtuNama(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ortu_wa">No. WhatsApp (Aktif)</Label>
                                                <Input id="edit_ortu_wa" value={editOrtuWa} onChange={e => setEditOrtuWa(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditSiswa(null)}>Batal</Button>
                                    <Button className="bg-[#000080] text-white" onClick={handleSaveEditSiswa} disabled={isEditSaving}>
                                        {isEditSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>

                {/* TAB 2: LOG & MONITORING */}
                <TabsContent value="monitoring" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                        <History className="w-5 h-5" />
                                        Log Kehadiran Individual
                                    </CardTitle>
                                    <CardDescription>Pantau riwayat kehadiran siswa secara detail.</CardDescription>
                                </div>
                                <div className="flex flex-row gap-2 w-full md:w-auto">
                                    <Input placeholder="Cari Siswa..." className="w-full md:w-64 bg-white" />
                                    <Button variant="outline"><Filter className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Siswa</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Keterangan / Mapel</TableHead>
                                        <TableHead className="text-right">Bukti</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { time: "Hari ini, 07:10", name: "Chandra Wijaya", status: "ALPHA", ket: "Tidak ada keterangan (Mapel: Matematika)", type: "A" },
                                        { time: "Hari ini, 07:05", name: "Bunga Citra", status: "IZIN", ket: "Sakit Demam (Validasi Wali Kelas)", type: "I" },
                                        { time: "Hari ini, 07:00", name: "Aditya Pratama", status: "HADIR", ket: "Presensi Masuk", type: "H" },
                                    ].map((log, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs font-mono text-slate-500">{log.time}</TableCell>
                                            <TableCell className="font-bold text-slate-700">{log.name}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    log.type === 'H' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" :
                                                        log.type === 'I' ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" :
                                                            "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{log.ket}</TableCell>
                                            <TableCell className="text-right">
                                                {log.type === 'I' && (
                                                    <Button variant="link" className="text-blue-600 h-auto p-0 text-xs">Lihat Surat</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: DISPENSASI */}
                <TabsContent value="dispensation" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-purple-50 border-b border-purple-100">
                                <CardTitle className="text-purple-900 text-base font-bold">Input Dispensasi</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Pilih Siswa</Label>
                                    <Input placeholder="Ketik nama siswa..." value={dispSiswaName} onChange={e => setDispSiswaName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Keperluan</Label>
                                    <Input placeholder="Contoh: Lomba Olahraga, Acara Keluarga..." value={dispKeperluan} onChange={e => setDispKeperluan(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rentang Tanggal</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={dispStartDate} onChange={e => setDispStartDate(e.target.value)} />
                                        <Input type="date" value={dispEndDate} onChange={e => setDispEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={handleMakeSurat}>
                                    Buat Surat Dispensasi
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Daftar Siswa Dispensasi (Aktif)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Siswa</TableHead>
                                            <TableHead>Keperluan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispensasiData.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                    <p className="text-xs text-slate-500">Kelas {item.cls}</p>
                                                </TableCell>
                                                <TableCell className="font-medium text-purple-700">{item.reason}</TableCell>
                                                <TableCell className="text-sm font-mono">{item.date}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => {
                                                        setDispensasiData(dispensasiData.filter((_, idx) => idx !== i));
                                                        toast.success("Catatan surat dispensasi telah dihapus.");
                                                    }}><XCircle className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Surat Preview Modal */}
                        <Dialog open={!!previewSurat} onOpenChange={(open) => !open && setPreviewSurat(null)}>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader className="print:hidden">
                                    <DialogTitle>Preview Surat Dispensasi</DialogTitle>
                                    <DialogDescription>Periksa kembali isi surat sebelum mencetak dan menyimpan ke database.</DialogDescription>
                                </DialogHeader>
                                {previewSurat && (
                                    <div className="bg-white p-8 border border-slate-200 mt-2 text-slate-800">
                                        <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                                            <h2 className="text-2xl font-black uppercase">Surat Izin Dispensasi Sekolah</h2>
                                            <p className="text-sm mt-1">Sistem Presensi SIPANDU • SMPK Santa Maria 2</p>
                                        </div>
                                        <div className="space-y-4 leading-relaxed">
                                            <p>Yang bertanda tangan di bawah ini, Kepala Admin Sekolah menerangkan bahwa:</p>
                                            <table className="w-full text-left font-medium ml-4">
                                                <tbody>
                                                    <tr><td className="w-32 py-1">Nama Siswa</td><td>: <strong>{previewSurat.name}</strong></td></tr>
                                                    <tr><td className="w-32 py-1">Catatan Kelas</td><td>: {previewSurat.cls}</td></tr>
                                                    <tr><td className="w-32 py-1">Keperluan</td><td>: <strong>{previewSurat.reason}</strong></td></tr>
                                                    <tr><td className="w-32 py-1">Tanggal Berlaku</td><td>: <strong>{previewSurat.date}</strong></td></tr>
                                                </tbody>
                                            </table>
                                            <p className="pt-2">Demikian surat dispensasi ini diberikan agar dapat dipergunakan sebagaimana mestinya dan dicatat secara sah di dalam sistem kehadiran. Mohon kebijaksanaan dari tenaga pendidik setempat atas absensi ananda pada tanggal tersebut.</p>
                                            <div className="mt-12 text-right">
                                                <p>Dikeluarkan pada: {new Date().toLocaleDateString('id-ID')}</p>
                                                <p className="font-bold mt-16 underline">Admin / Tata Usaha</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter className="print:hidden mt-4">
                                    <Button variant="outline" onClick={() => setPreviewSurat(null)}>Batal</Button>
                                    <Button className="bg-purple-700 text-white" onClick={handlePrintSurat}>
                                        <FileText className="w-4 h-4 mr-2" /> Simpan & Unduh Surat (PDF)
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>

                {/* TAB 4: TOOLS (ALUMNI & KENAIKAN) */}
                <TabsContent value="tools" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                        <CardHeader className="bg-amber-50 border-b border-amber-100 px-6 py-4">
                            <CardTitle className="text-amber-900 text-lg font-bold flex items-center gap-2">
                                <GraduationCap className="w-5 h-5" />
                                Manajemen Akhir Tahun & Alumni
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                        <ArrowUpRight className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Kenaikan Kelas Massal</h3>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Fitur untuk menaikkan tingkat siswa secara otomatis (7 ke 8, 8 ke 9).
                                            Pastikan semua nilai rapor sudah final.
                                        </p>
                                    </div>
                                    <Button className="w-full" variant="outline">Buka Menu Kenaikan Kelas</Button>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Arsip Alumni</h3>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Kelola data siswa yang sudah lulus. Data tetap tersimpan untuk keperluan legalisir
                                            atau rekam jejak akademik.
                                        </p>
                                    </div>
                                    <Button className="w-full" variant="outline">Lihat Database Alumni</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
