"use client";

import { useState } from "react";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { useKelasData } from "@/hooks/useKelasData";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useGuruData } from "@/hooks/useGuruData";
import { useRuanganData } from "@/hooks/useRuanganData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useJadwalData } from "@/hooks/useJadwalData";
import { useJurnalData } from "@/hooks/useJurnalData";
import { getApiBaseUrl } from "@/lib/api-config";
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
    FileSpreadsheet,
    Eye,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

const INITIAL_CLASSES: any[] = [];

export default function AdminKelasPage() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const { kelas: kelasData, refetch } = useKelasData();
    const { siswa: siswaData } = useSiswaData();
    const { guru: teachers, refetch: refetchTeachers } = useGuruData();
    const { refetch: refetchRooms } = useRuanganData();

    // Monitoring hooks
    const today = new Date().toISOString().split("T")[0];
    const todayDayName = DAY_NAMES[new Date().getDay()];
    const { jadwal: allSchedules } = useJadwalData(todayDayName);
    const { attendance: allAttendance } = useAttendanceData(today);
    const { jurnal: allJournals } = useJurnalData(today);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<any>({ id: "", grade: "VII", name: "", teacher: "", teacher_code: "" });
    const [kelasDetail, setKelasDetail] = useState<any>(null);



    const handleOpenDialog = (data: any = { id: "", grade: "VII", name: "", teacher: "", teacher_code: "" }) => {
        setFormData(data);
        setEditMode(!!data.id);
        setIsDialogOpen(true);
    };

    const handleSaveClass = () => {
        if (!formData.name || !formData.grade) return toast.error("Isi semua data kelas");

        setIsSaving(true);
        const method = editMode ? "PUT" : "POST";
        const payload = { ...formData, tahun_ajaran: selectedTahunAjaran };
        fetch(`${getApiBaseUrl()}/kelas/index.php`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(res => res.json()).then(data => {
            if(data.status === "success") {
                toast.success(data.message);
                refetch();
                refetchTeachers();
                refetchRooms();
                setIsDialogOpen(false);
            } else {
                toast.error(data.message);
            }
        }).catch(err => toast.error("Gagal terhubung ke server."))
          .finally(() => setIsSaving(false));
    };

    const handleDeleteClass = (id: any, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus kelas ${name}?`)) {
            fetch(`${getApiBaseUrl()}/kelas/index.php`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            }).then(res => res.json()).then(data => {
                if(data.status === "success") {
                    toast.success(data.message);
                    refetch();
                    refetchTeachers();
                    refetchRooms();
                } else {
                    toast.error(data.message);
                }
            }).catch(err => toast.error("Gagal terhubung ke server."));
        }
    };

    const handleExport = () => {
        const worksheet = xlsx.utils.json_to_sheet(kelasData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data_Kelas");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(data, "Data_Kelas.xlsx");
        toast.success("Data berhasil diekspor");
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
                                    <Label htmlFor="level" className="text-right">Tingkat/Grad</Label>
                                    <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Pilih Tingkat/Grad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="VII">Kelas VII</SelectItem>
                                            <SelectItem value="VIII">Kelas VIII</SelectItem>
                                            <SelectItem value="IX">Kelas IX</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Nama</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} id="name" placeholder="Contoh: 7A, 9C" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="wali" className="text-right">Wali Kelas</Label>
                                    <Select value={formData.teacher_code || "-"} onValueChange={(v) => {
                                        const selectedTeacher = teachers.find(t => t.teacherCode === v);
                                        setFormData({ 
                                            ...formData, 
                                            teacher_code: v, 
                                            teacher: selectedTeacher ? selectedTeacher.name : "-" 
                                        });
                                    }}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Pilih Guru" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            <SelectItem value="-">Tidak ada (-) </SelectItem>
                                            {teachers.map((t) => {
                                                const isTaken = !!(t.wali_kelas && t.wali_kelas !== "-" && t.wali_kelas !== "" && t.wali_kelas !== formData.name);
                                                return (
                                                    <SelectItem key={t.id} value={t.teacherCode} disabled={isTaken}>
                                                        <div className="flex justify-between items-center w-full gap-4">
                                                            <span>{t.name}</span>
                                                            {isTaken && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 italic">Terisi: {t.wali_kelas}</span>}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveClass} disabled={isSaving} className="bg-[#000080] text-white py-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Simpan"}
                                </Button>
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
                                        <TableHead className="w-[20%] font-bold text-[#000080]">Tingkat/Grad</TableHead>
                                        <TableHead className="w-[15%] font-bold text-[#000080]">Nama Kelas</TableHead>
                                        <TableHead className="w-[35%] font-bold text-[#000080]">Wali Kelas</TableHead>
                                        <TableHead className="w-[15%] font-bold text-[#000080] text-center">Jumlah Siswa</TableHead>
                                        <TableHead className="w-[15%] font-bold text-[#000080] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {kelasData.map((cls) => (
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
                                            <TableCell className="text-center font-bold text-slate-700">{siswaData?.filter(s => s.cls === cls.name).length || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button onClick={() => setKelasDetail(cls)} size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Lihat Daftar Siswa">
                                                        <Users className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleOpenDialog(cls)} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Edit Kelas">
                                                        <PenSquare className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDeleteClass(cls.id, cls.name)} size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" title="Hapus Kelas">
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

                    {/* Modal Daftar Siswa per Kelas */}
                    <Dialog open={!!kelasDetail} onOpenChange={(open) => !open && setKelasDetail(null)}>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-[#000080]">Daftar Siswa - Kelas {kelasDetail?.name}</DialogTitle>
                                <DialogDescription>
                                    Susunan daftar siswa pada kelas {kelasDetail?.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="overflow-x-auto mt-4 border border-slate-200">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="py-2 px-3 border-r border-slate-200 font-semibold text-[#0070c0] w-[50px] text-center">No</th>
                                            <th className="py-2 px-3 border-r border-slate-200 font-semibold text-[#0070c0] text-center">No Induk</th>
                                            <th className="py-2 px-3 border-r border-slate-200 font-semibold text-[#0070c0] text-center">Jenis Kelamin</th>
                                            <th className="py-2 px-3 font-semibold text-[#0070c0] text-left">Nama Siswa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {siswaData?.filter(s => s.cls === kelasDetail?.name).map((s: any, idx: any) => (
                                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                                                <td className="py-2 px-3 border-r border-slate-200 text-center">{s.noInduk}</td>
                                                <td className="py-2 px-3 border-r border-slate-200 text-center">{s.gender}</td>
                                                <td className="py-2 px-3">{s.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* TAB 2: MONITORING HARI INI (REAL-TIME) */}
                <TabsContent value="monitor" className="space-y-6">
                    {(() => {
                        const now = new Date();
                        const currentTime = now.getHours().toString().padStart(2, '0') + "." + now.getMinutes().toString().padStart(2, '0');

                        // For each class, find the current or latest schedule slot that has started
                        const monitorData = kelasData.map(cls => {
                            const classSchedules = allSchedules
                                .filter(s => s.class_name === cls.name)
                                .sort((a, b) => a.time_range.localeCompare(b.time_range));

                            // Find slot where current time is >= start time
                            const activeSlot = classSchedules
                                .filter(s => {
                                    const startTime = s.time_range.split(' - ')[0];
                                    return startTime <= currentTime;
                                })
                                .reverse()[0] || classSchedules[0]; // Take the latest started, or the first if none started

                            if (!activeSlot) return null;

                            const attendanceRecords = allAttendance.filter(a => a.schedule_id?.toString() === activeSlot.id?.toString());
                            const journal = allJournals.find(j => j.schedule_id?.toString() === activeSlot.id?.toString());
                            const isDone = attendanceRecords.length > 0;

                            return {
                                name: cls.name,
                                siswaCount: siswaData?.filter(s => s.cls === cls.name).length || 0,
                                mapel: activeSlot.subject_hint || activeSlot.teacher_mapel?.split(' (')[0] || "Mata Pelajaran",
                                guru: activeSlot.teacher_name || "Guru Pengampu",
                                status: isDone ? "DONE" : "PENDING",
                                time: activeSlot.time_range,
                                journal: journal?.topic || null
                            };
                        }).filter(Boolean);

                        const countDone = monitorData.filter(m => m?.status === "DONE").length;
                        const countPending = monitorData.filter(m => m?.status === "PENDING").length;

                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sudah Presensi</p>
                                                <p className="text-2xl font-black text-slate-800">
                                                    {countDone} <span className="text-sm font-medium text-slate-400">/ {monitorData.length} Kelas</span>
                                                </p>
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
                                                <p className="text-2xl font-black text-slate-800">
                                                    {countPending} <span className="text-sm font-medium text-slate-400">Kelas</span>
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {monitorData.map((cls: any, idx) => (
                                        <Card key={idx} className={`border-l-4 shadow-sm rounded-xl overflow-hidden ${cls.status === "DONE" ? "border-l-emerald-500" : "border-l-red-500"}`}>
                                            <CardHeader className="bg-white border-b border-slate-100 p-4 flex flex-row justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-black text-slate-800">{cls.name}</CardTitle>
                                                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {cls.siswaCount} Siswa
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
                                                        <p className="text-xs text-slate-600 italic line-clamp-2">
                                                            "{cls.journal || "Belum ada catatan jurnal."}"
                                                        </p>
                                                    </div>
                                                )}

                                                {cls.status === "PENDING" && (
                                                    <div className="pt-4">
                                                        <Button 
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch(`${getApiBaseUrl()}/notifikasi/index.php`, {
                                                                        method: "POST",
                                                                        body: JSON.stringify({
                                                                            type: "REMINDER",
                                                                            message: `Mohon segera lakukan presensi di kelas ${cls.name} untuk mata pelajaran ${cls.mapel}.`,
                                                                            teacher: cls.guru
                                                                        })
                                                                    });
                                                                    toast.success(`Pesan peringatan telah dikirim ke ${cls.guru}.`);
                                                                } catch(e) {
                                                                    toast.error("Gagal mengirim pengingat.");
                                                                }
                                                            }} 
                                                            size="sm" 
                                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-8 text-xs shadow-red-200 shadow-md"
                                                        >
                                                            <AlertTriangle className="w-3 h-3 mr-1" /> Ingatkan Guru
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        );
                    })()}
                </TabsContent>


            </Tabs>
        </div >
    );
}

