"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
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
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
    Loader2,
    Upload
} from "lucide-react";
import { toast } from "sonner";
import { useMapelData, MapelAPI } from "@/hooks/useMapelData";
import { useGuruData, GuruAPI } from "@/hooks/useGuruData";
import { useJadwalData, JadwalItem } from "@/hooks/useJadwalData";
import { useAppStore } from "@/lib/store";
import { useRuanganData } from "@/hooks/useRuanganData";
import { getApiBaseUrl } from "@/lib/api-config";
import { getPageAccessLevel } from "@/lib/access-control";

const MAPEL_IMPORT_HEADERS = ["code", "name", "grade", "hours", "cat"];

const normalizeImportHeader = (header: string) =>
    header
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "");

const getImportCellValue = (row: Record<string, unknown>, aliases: string[]) => {
    for (const alias of aliases) {
        const value = row[alias];
        if (value !== undefined && value !== null) return String(value).trim();
    }
    return "";
};

const normalizeMapelGrade = (value: string) => {
    const raw = value.trim().toUpperCase().replace(/^KELAS\s+/, "");
    const gradeMap: Record<string, string> = {
        "7": "VII",
        "VII": "VII",
        "8": "VIII",
        "VIII": "VIII",
        "9": "IX",
        "IX": "IX",
    };

    return gradeMap[raw] || raw;
};

export default function AdminMapelPage() {
    const [filterTingkat, setFilterTingkat] = useState("all");
    const [filterAbjad, setFilterAbjad] = useState<string[]>(["A", "B", "C", "D", "E"]);
    const [isRombelFilterOpen, setIsRombelFilterOpen] = useState(false);
    const [tempFilterAbjad, setTempFilterAbjad] = useState<string[]>(["A", "B", "C", "D", "E"]);
    const [rombelSearchQuery, setRombelSearchQuery] = useState("");
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const mapelImportInputRef = useRef<HTMLInputElement | null>(null);
    const [isImportingMapel, setIsImportingMapel] = useState(false);

    // State untuk form Tambah Mapel
    const [newMapelName, setNewMapelName] = useState("");
    const [newMapelCode, setNewMapelCode] = useState("");
    const [newMapelCat, setNewMapelCat] = useState("");

    const [newMapelGrade, setNewMapelGrade] = useState("VII");
    const [newMapelHours, setNewMapelHours] = useState("4");

    // State untuk Edit & Hapus
    const [editingMapel, setEditingMapel] = useState<MapelAPI | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [mapelToDelete, setMapelToDelete] = useState<MapelAPI | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { mapel: mapelList, refetch } = useMapelData();
    const { guru: guruData } = useGuruData();
    const { ruangan: ruanganData } = useRuanganData();
    const { jadwal: dbJadwal, loading: jadwalLoading, refetch: refetchJadwal } = useJadwalData();
    const currentUser = useAppStore(s => s.currentUser);
    const selectedTahunAjaran = useAppStore(s => s.selectedTahunAjaran);
    const accessMatrix = useAppStore(s => s.accessMatrix);
    const canEditSchedule = getPageAccessLevel(currentUser, "/admin/mapel", accessMatrix) === "full";

    // State untuk Edit Jadwal Slot
    const [editingSlot, setEditingSlot] = useState<any>(null);
    const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
    const [isSavingSlot, setIsSavingSlot] = useState(false);
    const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
    const [newSlotData, setNewSlotData] = useState({
        day: "SENIN",
        slot: "I",
        class_name: "",
        teacher_code: "",
        subject_code: "",
        subject_hint: "",
        room_code: "",
        time_range: ""
    });

    useEffect(() => {
        setIsLoadingJadwal(true);
        const timer = setTimeout(() => {
            setIsLoadingJadwal(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [filterTingkat, filterAbjad]);

    const getBebanJam = (m: MapelAPI) => {
        if (!dbJadwal || dbJadwal.length === 0) return { totalHours: m.hours, classCount: 0 };

        // 1. Dapatkan daftar kls di tingkat tersebut (misal VII A, VII B, dst)
        const gradeClasses = Array.from(new Set(
            dbJadwal.filter(j => j.class_name.startsWith(m.grade)).map(j => j.class_name)
        ));
        
        if (gradeClasses.length === 0) return { totalHours: m.hours, classCount: 0 };

        // 2. Ambil contoh rombel pertama
        const exampleClass = gradeClasses[0];

        // 3. Dapatkan guru pengampu mapel ini (untuk filter jadwal)
        const matchedTeacherCodes = guruData?.filter(g => {
            if (!g.mapel) return false;
            const safeName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${m.grade}\\b[^)]*\\)`, 'i');
            const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${m.grade}\\b`, 'i');
            return r1.test(g.mapel) || r2.test(g.mapel);
        }).map(g => g.teacherCode) || [];

        // 4. Hitung slot di rombel contoh yang isinya mapel ini
        const slots = dbJadwal.filter(j => {
            if (j.class_name !== exampleClass) return false;
            
            // Cek berdasarkan guru
            if (matchedTeacherCodes.includes(j.teacher_code)) return true;
            
            // Cek berdasarkan hint subjek (jika ada)
            if (j.subject_hint && m.name.toLowerCase().includes(j.subject_hint.toLowerCase())) return true;
            if (j.subject_hint && j.subject_hint.toLowerCase().includes(m.name.toLowerCase())) return true;
            
            // Cek berdasarkan teacher_mapel yang join dari API
            if (j.teacher_mapel && j.teacher_mapel.toLowerCase().includes(m.name.toLowerCase())) return true;

            return false;
        });

        // 5. Kembalikan jumlah jam pelajaran per rombel tersebut (atau fallback ke m.hours)
        return {
            totalHours: slots.length > 0 ? slots.length : m.hours,
            classCount: gradeClasses.length
        };
    };



    const handleSave = () => {
        if (!newMapelName || !newMapelCode) {
            toast.error("Mohon lengkapi semua data mata pelajaran!");
            return;
        }

        const newMapel = {
            code: newMapelCode,
            name: newMapelName,
            grade: newMapelGrade,
            hours: parseInt(newMapelHours) || 0,
            cat: newMapelCat || "Umum",
            tahun_ajaran: selectedTahunAjaran,
            teachers: []
        };

        fetch(`${getApiBaseUrl()}/mapel/index.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newMapel)
        }).then(res => res.json()).then(data => {
            if (data.status === "success") {
                toast.success("Mata pelajaran berhasil ditambahkan!");
                refetch();
            } else {
                toast.error(data.message);
            }
        }).catch(err => toast.error("Gagal terhubung ke server."));
        setIsAddOpen(false);
        setNewMapelName("");
        setNewMapelCode("");
        setNewMapelCat("");
        setNewMapelHours("4");
    };

    const rowsFromFirstSheet = (sheet: XLSX.WorkSheet) => {
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
        const headerIndex = rawRows.findIndex((row) => {
            const headers = row.map((cell) => normalizeImportHeader(String(cell)));
            return headers.some(h => ["code", "kode", "kode_mapel", "kodemapel"].includes(h)) &&
                headers.some(h => ["name", "nama", "mapel", "nama_mapel", "namamapel", "mata_pelajaran"].includes(h));
        });

        if (headerIndex === -1) return null;

        const headers = rawRows[headerIndex].map((cell) => String(cell).trim());
        return rawRows.slice(headerIndex + 1)
            .filter((row) => row.some((cell) => String(cell).trim() !== ""))
            .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
    };

    const normalizeMapelImportRow = (row: Record<string, unknown>) => {
        const normalized = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeImportHeader(key), value])
        );
        const hoursText = getImportCellValue(normalized, ["hours", "jam", "beban", "beban_jam", "beban_jam_minggu", "jp"]);

        return {
            code: getImportCellValue(normalized, ["code", "kode", "kode_mapel", "kodemapel"]),
            name: getImportCellValue(normalized, ["name", "nama", "mapel", "nama_mapel", "namamapel", "mata_pelajaran"]),
            grade: normalizeMapelGrade(getImportCellValue(normalized, ["grade", "tingkat", "kelas", "tingkat_kelas"])),
            hours: Number.parseInt(hoursText, 10) || 0,
            cat: getImportCellValue(normalized, ["cat", "kategori"]) || "Umum",
            tahun_ajaran: selectedTahunAjaran,
        };
    };

    const handleImportMapelFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingMapel(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = rowsFromFirstSheet(sheet);

            if (!rows) {
                toast.error("Header import tidak ditemukan. Pastikan ada kolom code/kode dan name/nama.");
                return;
            }

            if (rows.length === 0) {
                toast.error("File import mapel kosong");
                return;
            }

            const seenCodes = new Set<string>();
            const validRows: ReturnType<typeof normalizeMapelImportRow>[] = [];
            let missingCode = 0;
            let missingName = 0;
            let invalidGrade = 0;
            let duplicate = 0;

            for (const row of rows) {
                const data = normalizeMapelImportRow(row);
                const importKey = `${data.code.toUpperCase()}|${data.tahun_ajaran || ""}`;
                if (!data.code) {
                    missingCode++;
                    continue;
                }
                if (!data.name) {
                    missingName++;
                    continue;
                }
                if (!["VII", "VIII", "IX"].includes(data.grade)) {
                    invalidGrade++;
                    continue;
                }
                if (seenCodes.has(importKey)) {
                    duplicate++;
                    continue;
                }
                seenCodes.add(importKey);
                validRows.push(data);
            }

            if (validRows.length === 0) {
                toast.error(`Tidak ada baris valid. Kode kosong: ${missingCode}, nama kosong: ${missingName}, tingkat salah: ${invalidGrade}, duplikat: ${duplicate}.`);
                return;
            }

            const response = await fetch(`${getApiBaseUrl()}/mapel/index.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validRows),
            });
            const data = await response.json();
            const skipped = missingCode + missingName + invalidGrade + duplicate;

            if (data.status === "success") {
                toast.success(`${data.message}. ${skipped} baris dilewati.`);
                refetch();
            } else {
                toast.error(data.message || "Gagal import mapel");
            }
        } catch (error) {
            toast.error("Gagal membaca file mapel. Gunakan CSV, XLS, atau XLSX sesuai template.");
        } finally {
            setIsImportingMapel(false);
            event.target.value = "";
        }
    };

    const downloadMapelTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            {
                code: "MTK-VII",
                name: "Matematika",
                grade: "VII",
                hours: 4,
                cat: "Umum",
            },
            {
                code: "BIN-VII",
                name: "Bahasa Indonesia",
                grade: "VII",
                hours: 4,
                cat: "Umum",
            },
        ], { header: MAPEL_IMPORT_HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "template_mapel");
        XLSX.writeFile(workbook, "template_import_mapel.xlsx");
    };

    const handleEditSave = () => {
        if (!editingMapel) return;
        setIsSaving(true);
        fetch(`${getApiBaseUrl()}/mapel/index.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...editingMapel, tahun_ajaran: editingMapel.tahun_ajaran || selectedTahunAjaran })
        }).then(res => res.json()).then(data => {
            if (data.status === "success") {
                toast.success("Mata pelajaran berhasil diperbarui!");
                refetch();
                setIsEditOpen(false);
                setEditingMapel(null);
            } else {
                toast.error(data.message);
            }
        }).catch(err => toast.error("Gagal terhubung ke server."))
          .finally(() => setIsSaving(false));
    };

    const handleDelete = () => {
        if (!mapelToDelete) return;
        fetch(`${getApiBaseUrl()}/mapel/index.php`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: mapelToDelete.id })
        }).then(res => res.json()).then(data => {
            if (data.status === "success") {
                toast.success("Mata pelajaran berhasil dihapus!");
                refetch();
                setIsDeleteOpen(false);
                setMapelToDelete(null);
            } else {
                toast.error(data.message);
            }
        }).catch(err => toast.error("Gagal terhubung ke server."));
    };

    const handleSaveSlot = async (isNew: boolean = false) => {
        const data = isNew ? { ...newSlotData, tahun_ajaran: selectedTahunAjaran } : { ...editingSlot, tahun_ajaran: editingSlot?.tahun_ajaran || selectedTahunAjaran };
        if (!data.day || !data.slot || !data.class_name) {
            toast.error("Mohon lengkapi Hari, Jam, dan Kelas!");
            return;
        }

        setIsSavingSlot(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/jadwal/index.php`, {
                method: isNew ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === "success") {
                toast.success(isNew ? "Jadwal berhasil ditambahkan!" : "Jadwal berhasil diperbarui!");
                refetchJadwal();
                setIsEditSlotOpen(false);
                setIsAddSlotOpen(false);
                setEditingSlot(null);
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error("Gagal menyimpan jadwal.");
        } finally {
            setIsSavingSlot(false);
        }
    };

    const handleDeleteSlot = async () => {
        if (!editingSlot || !editingSlot.id) return;
        if (!confirm("Hapus jadwal ini?")) return;
        
        setIsSavingSlot(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/jadwal/index.php`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingSlot.id })
            });
            const result = await res.json();
            if (result.status === "success") {
                toast.success("Jadwal dihapus!");
                refetchJadwal();
                setIsEditSlotOpen(false);
                setEditingSlot(null);
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error("Gagal menghapus jadwal.");
        } finally {
            setIsSavingSlot(false);
        }
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
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold" onClick={downloadMapelTemplate}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Template
                    </Button>
                    <input
                        ref={mapelImportInputRef}
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        className="hidden"
                        onChange={handleImportMapelFile}
                    />
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold" onClick={() => mapelImportInputRef.current?.click()} disabled={isImportingMapel}>
                        {isImportingMapel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isImportingMapel ? "Mengimpor..." : "Import Mapel"}
                    </Button>
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
                                <div className="grid gap-2 invisible h-0 overflow-hidden">
                                    {/* Kategori removed */}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="grade">Tingkat Kelas</Label>
                                        <Select value={newMapelGrade} onValueChange={setNewMapelGrade}>
                                            <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="VII">Kelas VII</SelectItem>
                                                <SelectItem value="VIII">Kelas VIII</SelectItem>
                                                <SelectItem value="IX">Kelas IX</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="hours">Beban Jam / Minggu</Label>
                                        <Input id="hours" type="number" placeholder="Contoh: 4" value={newMapelHours} onChange={(e) => setNewMapelHours(e.target.value)} />
                                    </div>
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
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-1 md:grid-cols-2 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="catalog" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-6 font-bold h-10 w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Katalog Mapel
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-6 font-bold h-10">
                        <Calendar className="w-4 h-4 mr-2" />
                        Jadwal Pelajaran
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: KATALOG MAPEL */}
                <TabsContent value="catalog" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Stats */}
                        <Card className="bg-blue-50 border-blue-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-center">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Mapel</p>
                                <p className="text-2xl font-black text-[#000080]">{mapelList?.length || 0} <span className="text-sm font-medium text-blue-400">Mapel</span></p>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                            <CardContent className="p-4 flex flex-col justify-center">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Guru Mapel</p>
                                <p className="text-2xl font-black text-emerald-800">{guruData?.length || 0} <span className="text-sm font-medium text-emerald-500">Guru</span></p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Table */}
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
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
                                        <TableHead className="font-bold text-[#000080] w-[80px] text-center">Kode</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Mata Pelajaran</TableHead>
                                        <TableHead className="font-bold text-[#000080] w-[100px] text-center">Tingkat</TableHead>
                                        <TableHead className="font-bold text-[#000080] w-[100px] text-center">Beban</TableHead>
                                        <TableHead className="font-bold text-[#000080]">Guru Pengampu</TableHead>
                                        <TableHead className="font-bold text-[#000080] w-[100px] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...mapelList].sort((a,b) => {
                                        const grades: Record<string, number> = { "VII": 7, "VIII": 8, "IX": 9 };
                                        if (grades[a.grade] !== grades[b.grade]) {
                                            return (grades[a.grade] || 0) - (grades[b.grade] || 0);
                                        }
                                        return a.name.localeCompare(b.name);
                                    }).map((m, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs font-bold text-slate-500 text-center">{m.code.split(' (')[0]}</TableCell>
                                            <TableCell className="font-bold text-slate-800">{m.name.split(' (')[0]}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="font-bold text-slate-600 border-slate-200 bg-slate-50">
                                                    Kls {m.grade}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-[#000080] text-sm">{getBebanJam(m).totalHours} Jam / Kls</span>
                                                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 rounded mt-0.5">{getBebanJam(m).classCount} Kelas Aktif</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                        const matchedTeachers = guruData?.filter(g => {
                                                            if (!g.mapel) return false;
                                                            // Match "Name ( Grade )" or legacy "Name - Kelas Grade"
                                                            const safeName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                            const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${m.grade}\\b[^)]*\\)`, 'i');
                                                            const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${m.grade}\\b`, 'i');
                                                            return r1.test(g.mapel) || r2.test(g.mapel);
                                                        }) || [];
                                                    return matchedTeachers.length > 0 ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {matchedTeachers.map((g: GuruAPI, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2 group/teacher">
                                                                    <div className="w-5 h-5 rounded-full bg-[#000080]/10 flex items-center justify-center text-[8px] font-bold text-[#000080]">
                                                                        {g.name.charAt(0)}
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-700 group-hover/teacher:text-[#000080] transition-colors">{g.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-slate-400 italic">Belum ada pengampu</span>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => {
                                                        setEditingMapel({...m});
                                                        setIsEditOpen(true);
                                                    }}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => {
                                                        setMapelToDelete(m);
                                                        setIsDeleteOpen(true);
                                                    }}>
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
                            <div className="flex flex-col xl:flex-row gap-4 w-full md:w-auto items-start xl:items-center">
                                <DropdownMenu open={isRombelFilterOpen} onOpenChange={(open) => {
                                    if (open) {
                                        setTempFilterAbjad(filterAbjad);
                                        setRombelSearchQuery("");
                                        setIsRombelFilterOpen(true);
                                    } else {
                                        setIsRombelFilterOpen(false);
                                    }
                                }}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full sm:w-auto min-w-[160px] bg-white flex items-center justify-between border-slate-200">
                                            <span className="flex items-center gap-2 text-slate-700">
                                                <Filter className="w-4 h-4" />
                                                {filterTingkat === 'all' ? 'Semua Tingkat' : `Kelas ${filterTingkat}`}
                                            </span>
                                            {filterAbjad.length > 0 && filterAbjad.length < 6 && (
                                                <Badge variant="secondary" className="ml-2 bg-[#000080]/10 text-[#000080] rounded-sm px-1.5 font-bold">
                                                    {filterAbjad.length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[240px] p-2 bg-white flex flex-col gap-2">
                                        {/* Pilihan Tingkat terintegrasi dalam pop-up */}
                                        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-md mb-1">
                                            {[
                                                { val: 'all', label: 'All' },
                                                { val: 'VII', label: 'Kls VII' },
                                                { val: 'VIII', label: 'Kls VIII' },
                                                { val: 'IX', label: 'Kls IX' },
                                            ].map(t => (
                                                <button
                                                    key={t.val}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFilterTingkat(t.val);
                                                    }}
                                                    className={`text-[10px] py-1 rounded-sm font-bold transition-all ${filterTingkat === t.val ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <Search className="w-3 h-3 absolute left-2 top-1.5 text-slate-400" />
                                            <input
                                                value={rombelSearchQuery}
                                                onChange={e => setRombelSearchQuery(e.target.value)}
                                                placeholder="Cari Kelas"
                                                className="w-full h-6 pl-7 pr-2 text-xs border border-slate-200 focus:outline-none focus:border-[#000080] rounded-sm"
                                            />
                                        </div>
                                        <div className="border border-slate-200 max-h-48 overflow-y-auto py-1">
                                            <label className="flex items-center gap-2 px-2 py-0.5 mt-0.5 hover:bg-slate-50 cursor-pointer text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    className="w-3 h-3 accent-[#000080] shrink-0"
                                                    checked={tempFilterAbjad.length === 5}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setTempFilterAbjad(["A", "B", "C", "D", "E"]);
                                                        else setTempFilterAbjad([]);
                                                    }}
                                                />
                                                <span className="text-[11px] font-bold leading-none">(Select All)</span>
                                            </label>

                                            <div className="relative mt-1">
                                                {/* Vertical connector line for all children */}
                                                <div className="absolute left-[13px] top-0 bottom-[10px] w-px border-l border-dotted border-slate-400 pointer-events-none z-0"></div>

                                                {["A", "B", "C", "D", "E"]
                                                    .filter(char => char.toLowerCase().includes(rombelSearchQuery.toLowerCase()))
                                                    .map((char) => (
                                                        <label key={char} className="relative flex items-center gap-2 pl-[25px] pr-2 py-0.5 hover:bg-slate-50 cursor-pointer text-slate-700 group">
                                                            {/* Horizontal connector line specifically for this node */}
                                                            <div className="absolute left-[13px] top-1/2 w-2 border-t border-dotted border-slate-400 pointer-events-none z-0"></div>

                                                            <input
                                                                type="checkbox"
                                                                className="w-3 h-3 accent-[#000080] shrink-0 relative z-10"
                                                                checked={tempFilterAbjad.includes(char)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setTempFilterAbjad([...tempFilterAbjad, char]);
                                                                    else setTempFilterAbjad(tempFilterAbjad.filter(c => c !== char));
                                                                }}
                                                            />
                                                            <span className="text-[11px] leading-none">Kelas {filterTingkat === 'all' ? char : filterTingkat + char}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-1.5 pt-1 mt-1">
                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-3 py-0 rounded-sm bg-white" onClick={() => setIsRombelFilterOpen(false)}>Cancel</Button>
                                            <Button size="sm" className="h-6 text-[10px] px-3 py-0 font-bold rounded-sm" onClick={() => {
                                                setFilterAbjad(tempFilterAbjad);
                                                setIsRombelFilterOpen(false);
                                            }}>OK</Button>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {canEditSchedule && (
                                    <Button className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold" onClick={() => setIsAddSlotOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah Jadwal
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full sm:w-auto text-slate-600">
                                    <Copy className="w-4 h-4 mr-2" />
                                    Salin Jadwal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[calc(100vh-250px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                <div className="min-w-max">
                                        {isLoadingJadwal ? (
                                            <div className="p-8 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-[#000080] mx-auto" />
                                                <p className="text-sm font-medium text-slate-500 mt-2">Memuat jadwal pelajaran...</p>
                                            </div>
                                        ) : (
                                            ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"].map((day, dIdx) => {
                                                const displayRombels: string[] = [];
                                                const tingkats = filterTingkat === 'all' ? ['VII', 'VIII', 'IX'] : [filterTingkat];
                                                for (const t of tingkats) {
                                                    for (const a of ["A", "B", "C", "D", "E", "F"]) {
                                                        if (filterAbjad.includes(a)) {
                                                            displayRombels.push(`${t} ${a}`);
                                                        }
                                                    }
                                                }

                                                if (displayRombels.length === 0) return null;

                                                const daySlots = [
                                                    ...(day !== 'SENIN' ? [{ jam: "0", time: "06.45 - 06.55" }] : []),
                                                    { jam: "1", time: day === 'SENIN' ? "06.45 - 07.35" : "06.55 - 07.35" },
                                                    { jam: "2", time: "07.35 - 08.15" },
                                                    { jam: "3", time: "08.15 - 08.55" },
                                                    { jam: "IST", time: "08.55 - 09.15", type: "BREAK" },
                                                    { jam: "4", time: "09.15 - 09.55" },
                                                    { jam: "5", time: "09.55 - 10.35" },
                                                    { jam: "6", time: "10.35 - 11.15" },
                                                    { jam: "IST", time: "11.15 - 11.30", type: "BREAK" },
                                                    { jam: "7", time: "11.30 - 12.15" },
                                                    { jam: "8", time: "12.15 - 12.55" },
                                                    { jam: "9", time: "12.55 - 13.45" }
                                                ];

                                                const slotKeys = day !== 'SENIN' ? [0, 1, 2, 3, 'IST', 4, 5, 6, 'IST', 7, 8, 9] : [1, 2, 3, 'IST', 4, 5, 6, 'IST', 7, 8, 9];

                                                return (
                                                    <div key={day} className="mb-10 last:mb-0">
                                                        <div className="bg-[#000080] text-white px-4 py-2.5 font-black uppercase tracking-widest text-center sticky top-0 z-[35] shadow-md">
                                                            {day}
                                                        </div>
                                                        <Table className="border-x border-slate-200 border-separate border-spacing-0">
                                                            <TableHeader className="bg-slate-50 sticky top-0 z-30 shadow-sm">
                                                                <TableRow className="hover:bg-transparent">
                                                                    <TableHead className="w-24 font-bold text-center text-slate-500 bg-slate-50 border-r border-b border-slate-200 sticky left-0 z-40">KELAS</TableHead>
                                                                    {daySlots.map((slot, i) => (
                                                                        <TableHead key={i} className="text-center font-bold text-[#000080] bg-slate-50 border-r border-b border-slate-200 min-w-[150px] p-2">
                                                                            <div className="flex flex-col items-center justify-center">
                                                                                <span className={slot.type === 'BREAK' ? "text-[9px] font-bold uppercase tracking-widest text-slate-500" : "text-[11px] font-black"}>
                                                                                    {slot.jam === 'IST' ? 'ISTIRAHAT' : 
                                                                                     (day === 'SENIN' && slot.jam === '1' ? 'UPACARA' : 
                                                                                      (day !== 'SENIN' && slot.jam === '0' ? 'DOA & SABDA' : `JAM ${slot.jam}`))}
                                                                                </span>
                                                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{slot.time}</span>
                                                                            </div>
                                                                        </TableHead>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {displayRombels.map((rombel, rIdx) => (
                                                                    <TableRow key={`${day}-${rombel}`} className="hover:bg-slate-50/50 group/row">
                                                                        <TableCell className="text-center font-bold text-[#000080] bg-blue-50/5 border-r border-slate-200 border-b border-slate-200 whitespace-nowrap sticky left-0 z-20 group-hover/row:bg-blue-100/50 transition-colors">
                                                                            {rombel}
                                                                        </TableCell>

                                                                        {daySlots.map((slotItem, sIdx) => {
                                                                            const jam = slotItem.jam;
                                                                            if (jam === 'IST') {
                                                                                if (rIdx === 0) {
                                                                                    return (
                                                                                        <TableCell key={`IST-${rIdx}-${sIdx}`} rowSpan={displayRombels.length} className="text-center py-2 bg-slate-50 border-r border-slate-100 border-b border-slate-200 align-middle">
                                                                                            <span className="inline-flex items-center px-1 py-4 justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                                                                Istirahat
                                                                                            </span>
                                                                                        </TableCell>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            }

                                                                            const jamNum = typeof jam === 'string' ? parseInt(jam) : jam;
                                                                            const jamKey = jam === 'IST' ? 'IST' : (typeof jamNum === 'number' && !isNaN(jamNum) ? 
                                                                                (jamNum === 0 ? '0' : jamNum === 1 ? 'I' : jamNum === 2 ? 'II' : jamNum === 3 ? 'III' : jamNum === 4 ? 'IV' : jamNum === 5 ? 'V' : jamNum === 6 ? 'VI' : jamNum === 7 ? 'VII' : jamNum === 8 ? 'VIII' : 'IX') 
                                                                                : jam);
                                                                            
                                                                            const cellData = dbJadwal.find(j => j.day === day && j.slot === jamKey && j.class_name === rombel);
                                                                            
                                                                            let mapelName = "";
                                                                            let teacherName = "-";
                                                                            
                                                                            if (day === 'SENIN' && jamNum === 1) {
                                                                                mapelName = 'UPACARA';
                                                                            } else if (day !== 'SENIN' && jamNum === 0) {
                                                                                mapelName = 'DOA dan SABDA';
                                                                            }
                                                                            
                                                                            if (cellData?.teacher_code === 'UPACARA' || cellData?.subject_code === 'UPACARA') {
                                                mapelName = 'UPACARA';
                                            } else if (cellData?.teacher_code === 'DOA dan SABDA' || cellData?.subject_code === 'DOA') {
                                                mapelName = 'DOA dan SABDA';
                                            } else if (cellData?.teacher_code === 'SENAM' || cellData?.subject_code === 'SENAM') {
                                                mapelName = 'SENAM / LITERASI';
                                            } else if (cellData?.teacher_code === 'PRAMUKA' || cellData?.subject_code === 'PRAMUKA') {
                                                mapelName = 'PRAMUKA';
                                            } else if (cellData?.subject_code) {
                                                // Prioritas 1: Ambil dari master mapel jika ada subject_code
                                                const masterMapel = mapelList.find(m => m.code === cellData.subject_code);
                                                mapelName = masterMapel ? masterMapel.name : (cellData.subject_hint || cellData.subject_code);
                                            } else if (cellData?.teacher_code === 'S') {
                                                mapelName = 'IPS';
                                                const g = guruData.find(guru => guru.teacherCode === '6');
                                                teacherName = g ? g.name.split(',')[0] : '-';
                                            } else if (cellData?.teacher_code === '3D') {
                                                mapelName = 'Bahasa Daerah';
                                                const g = guruData.find(guru => guru.teacherCode === '3');
                                                teacherName = g ? g.name.split(',')[0] : '-';
                                            } else if (cellData?.teacher_code === '3') {
                                                mapelName = 'Bimbingan Konseling';
                                                const g = guruData.find(guru => guru.teacherCode === '3');
                                                teacherName = g ? g.name.split(',')[0] : '-';
                                            } else if (cellData && cellData.teacher_code) {
                                                const codes = cellData.teacher_code.split('/');
                                                const displayTeachers = codes.map((c: string) => {
                                                    const g = guruData.find(guru => guru.teacherCode === c);
                                                    return g ? g.name.split(',')[0] : `Kode ${c}`;
                                                });
                                                teacherName = displayTeachers.join(' / ');
                                                const firstGuru = guruData.find(guru => guru.teacherCode === codes[0]);
                                                if (firstGuru && firstGuru.mapel) {
                                                    mapelName = firstGuru.mapel.split('(')[0].trim();
                                                } else if (cellData.subject_hint) {
                                                    mapelName = cellData.subject_hint;
                                                } else {
                                                    mapelName = cellData.teacher_code;
                                                }
                                            }

                                                                            return (
                                                                                <TableCell key={`${jam}-${rIdx}`} className="p-2 border-r border-slate-50 border-b border-slate-100 last:border-r-0 align-top min-w-[140px] max-w-[160px]">
                                                                                    <div 
                                                                                        onClick={() => {
                                                                                            if (canEditSchedule) {
                                                                                                if (cellData) {
                                                                                                    setEditingSlot({...cellData});
                                                                                                    setIsEditSlotOpen(true);
                                                                                                } else {
                                                                                                    setNewSlotData({
                                                                                                        ...newSlotData,
                                                                                                        day,
                                                                                                        slot: jamKey,
                                                                                                        class_name: rombel,
                                                                                                        time_range: slotItem.time
                                                                                                    });
                                                                                                    setIsAddSlotOpen(true);
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        className={`border text-left rounded-lg p-2 shadow-sm transition-all group h-full min-h-[56px] flex flex-col justify-center ${
                                                                                            canEditSchedule ? 'cursor-pointer' : 'cursor-default'
                                                                                        } ${
                                                                                            mapelName === 'UPACARA' ? 'bg-slate-800 border-slate-900 text-white' :
                                                                                            mapelName === 'DOA dan SABDA' || mapelName === 'DOA & SABDA' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                                                                            mapelName === 'SENAM / LITERASI' || (day === 'KAMIS' && jamNum === 1) ? 'bg-purple-50 border-purple-200 text-purple-800' :
                                                                                            mapelName ? 'bg-white border-slate-200 hover:border-[#000080] hover:shadow-md' : 'bg-slate-50/30 border-dashed border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                                                                        }`}>
                                                                                            {mapelName ? (
                                                                                                <>
                                                                                                    <p className={`font-bold text-[11px] leading-tight line-clamp-2 ${
                                                                                                        mapelName === 'UPACARA' ? 'text-white' :
                                                                                                        mapelName === 'DOA dan SABDA' || mapelName === 'DOA & SABDA' ? 'text-amber-900' :
                                                                                                        mapelName === 'SENAM / LITERASI' || (day === 'KAMIS' && jamNum === 1) ? 'text-purple-900' :
                                                                                                        'text-slate-800 group-hover:text-[#000080]'
                                                                                                    }`} title={mapelName}>
                                                                                                        {day === 'KAMIS' && jamNum === 1 && mapelName !== 'SENAM' ? (mapelName || 'SENAM/LITERASI') : mapelName}
                                                                                                    </p>
                                                                                                    {teacherName !== "-" && (
                                                                                                        <div className="flex items-center gap-1 mt-1.5 text-slate-500">
                                                                                                            <User className="w-3 h-3 shrink-0" />
                                                                                                            <p className="text-[10px] truncate" title={teacherName}>{teacherName}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </>
                                                                                            ) : (
                                                                                                <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                    <Plus className="w-4 h-4 text-slate-400" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                        </CardContent>
                            </Card>
                        </TabsContent>


            </Tabs>

            {/* Dialog Edit Jadwal Slot */}
            <Dialog open={isEditSlotOpen} onOpenChange={setIsEditSlotOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-blue-600" />
                            Edit Slot Jadwal
                        </DialogTitle>
                        <DialogDescription>
                            Ubah penugasan guru dan mata pelajaran untuk <b>{editingSlot?.class_name}</b> di hari <b>{editingSlot?.day}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSlot && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500">HARI</Label>
                                    <Input value={editingSlot.day} disabled className="bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500">JAM / SLOT</Label>
                                    <Input value={editingSlot.slot} disabled className="bg-slate-50" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">MATA PELAJARAN (MASTER)</Label>
                                <Select value={editingSlot.subject_code || ""} onValueChange={v => {
                                    const m = mapelList.find(x => x.code === v);
                                    let nextTeacher = editingSlot.teacher_code;
                                    
                                    if (m) {
                                        const filtered = guruData.filter(g => {
                                            if (!g.mapel) return false;
                                            const safeName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${m.grade}\\b[^)]*\\)`, 'i');
                                            const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${m.grade}\\b`, 'i');
                                            return r1.test(g.mapel) || r2.test(g.mapel);
                                        });
                                        if (filtered.length === 1) nextTeacher = filtered[0].teacherCode;
                                    }

                                    setEditingSlot({
                                        ...editingSlot, 
                                        subject_code: v, 
                                        subject_hint: m ? m.name : editingSlot.subject_hint,
                                        teacher_code: nextTeacher
                                    });
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPACARA">UPACARA</SelectItem>
                                        <SelectItem value="DOA">DOA dan SABDA</SelectItem>
                                        <SelectItem value="SENAM">SENAM / LITERASI</SelectItem>
                                        <DropdownMenuSeparator />
                                        {mapelList.filter(m => m.grade === editingSlot.class_name.split(' ')[0]).map(m => (
                                            <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">GURU PENGAMPU</Label>
                                <Select value={editingSlot.teacher_code || ""} onValueChange={v => setEditingSlot({...editingSlot, teacher_code: v})}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        <SelectItem value="-">Tidak ada</SelectItem>
                                        <SelectItem value="UPACARA">Sistem (Upacara)</SelectItem>
                                        <SelectItem value="DOA dan SABDA">Sistem (Doa)</SelectItem>
                                        <DropdownMenuSeparator />
                                        {(() => {
                                            const currentMapel = mapelList.find(m => m.code === editingSlot.subject_code);
                                            const filteredGurus = currentMapel ? guruData.filter(g => {
                                                if (!g.mapel) return false;
                                                const safeName = currentMapel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${currentMapel.grade}\\b[^)]*\\)`, 'i');
                                                const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${currentMapel.grade}\\b`, 'i');
                                                return r1.test(g.mapel) || r2.test(g.mapel);
                                            }) : guruData;

                                            return (filteredGurus.length > 0 ? filteredGurus : guruData).map(g => (
                                                <SelectItem key={g.id} value={g.teacherCode}>
                                                    {g.name} {filteredGurus.length > 0 ? "" : "(Tampilkan Semua)"}
                                                </SelectItem>
                                            ));
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">KETERANGAN TAMBAHAN (HINT)</Label>
                                <Input placeholder="Nama Mapel custom atau info tambahan" value={editingSlot.subject_hint || ""} onChange={e => setEditingSlot({...editingSlot, subject_hint: e.target.value})} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">RUANGAN (OPSIONAL)</Label>
                                <Select value={editingSlot.room_code || ""} onValueChange={v => setEditingSlot({...editingSlot, room_code: v})}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Ruangan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="-">Gunakan Homebase Guru</SelectItem>
                                        {ruanganData.map(r => (
                                            <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-between items-center sm:justify-between">
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDeleteSlot}>Hapus</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditSlotOpen(false)}>Batal</Button>
                            <Button className="bg-[#000080] text-white" onClick={() => handleSaveSlot(false)} disabled={isSavingSlot}>
                                {isSavingSlot ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Update"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Tambah Jadwal Slot */}
            <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#000080]">
                            <Plus className="w-5 h-5" />
                            Tambah Jadwal Baru
                        </DialogTitle>
                        <DialogDescription>Input plotting jadwal pelajaran baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">HARI</Label>
                                <Select value={newSlotData.day} onValueChange={v => setNewSlotData({...newSlotData, day: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500">JAM / SLOT</Label>
                                <Select value={newSlotData.slot} onValueChange={v => setNewSlotData({...newSlotData, slot: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"].map(s => <SelectItem key={s} value={s}>Jam {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">KELAS</Label>
                            <Select value={newSlotData.class_name} onValueChange={v => setNewSlotData({...newSlotData, class_name: v})}>
                                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                <SelectContent>
                                    {["VII", "VIII", "IX"].map(g => ["A", "B", "C", "D", "E"].map(a => (
                                        <SelectItem key={`${g} ${a}`} value={`${g} ${a}`}>{g} {a}</SelectItem>
                                    )))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">MATA PELAJARAN</Label>
                            <Select value={newSlotData.subject_code} onValueChange={v => {
                            const m = mapelList.find(x => x.code === v);
                            let nextTeacher = newSlotData.teacher_code;

                            if (m) {
                                const filtered = guruData.filter(g => {
                                    if (!g.mapel) return false;
                                    const safeName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${m.grade}\\b[^)]*\\)`, 'i');
                                    const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${m.grade}\\b`, 'i');
                                    return r1.test(g.mapel) || r2.test(g.mapel);
                                });
                                if (filtered.length === 1) nextTeacher = filtered[0].teacherCode;
                            }

                            setNewSlotData({
                                ...newSlotData, 
                                subject_code: v, 
                                subject_hint: m ? m.name : "",
                                teacher_code: nextTeacher
                            });
                        }}>
                                <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                <SelectContent>
                                    {mapelList.map(m => (
                                        <SelectItem key={m.id} value={m.code}>{m.name} ({m.grade})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">GURU</Label>
                            <Select value={newSlotData.teacher_code} onValueChange={v => setNewSlotData({...newSlotData, teacher_code: v})}>
                                <SelectTrigger><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-">Tidak ada</SelectItem>
                                    {(() => {
                                        const currentMapel = mapelList.find(m => m.code === newSlotData.subject_code);
                                        const filteredGurus = currentMapel ? guruData.filter(g => {
                                            if (!g.mapel) return false;
                                            const safeName = currentMapel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            const r1 = new RegExp(`${safeName}\\s*\\([^)]*\\b${currentMapel.grade}\\b[^)]*\\)`, 'i');
                                            const r2 = new RegExp(`${safeName}\\s*-\\s*Kelas\\s*${currentMapel.grade}\\b`, 'i');
                                            return r1.test(g.mapel) || r2.test(g.mapel);
                                        }) : guruData;

                                        return (filteredGurus.length > 0 ? filteredGurus : guruData).map(g => (
                                            <SelectItem key={g.id} value={g.teacherCode}>
                                                {g.name} {filteredGurus.length > 0 ? "" : "(Tampilkan Semua)"}
                                            </SelectItem>
                                        ));
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>Batal</Button>
                        <Button className="bg-[#000080] text-white" onClick={() => handleSaveSlot(true)} disabled={isSavingSlot}>
                            {isSavingSlot ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Simpan Jadwal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Mapel */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Mata Pelajaran</DialogTitle>
                        <DialogDescription>Perbarui informasi mata pelajaran.</DialogDescription>
                    </DialogHeader>
                    {editingMapel && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Mata Pelajaran</Label>
                                <Input id="edit-name" value={editingMapel.name} onChange={(e) => setEditingMapel({...editingMapel, name: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Kode Mapel</Label>
                                <Input id="edit-code" value={editingMapel.code} onChange={(e) => setEditingMapel({...editingMapel, code: e.target.value})} />
                            </div>
                            <div className="grid gap-2 invisible h-0 overflow-hidden">
                                {/* Kategori removed */}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-grade">Tingkat Kelas</Label>
                                    <Select value={editingMapel.grade} onValueChange={(val) => setEditingMapel({...editingMapel, grade: val})}>
                                        <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="VII">Kelas VII</SelectItem>
                                            <SelectItem value="VIII">Kelas VIII</SelectItem>
                                            <SelectItem value="IX">Kelas IX</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-hours">Beban Jam / Minggu</Label>
                                    <Input id="edit-hours" type="number" value={editingMapel.hours} onChange={(e) => setEditingMapel({...editingMapel, hours: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                        <Button className="bg-[#000080] text-white" onClick={handleEditSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Hapus Mapel */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Hapus Mata Pelajaran
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus mata pelajaran <b>{mapelToDelete?.name}</b>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 font-bold">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Ya, Hapus Permanen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

