"use client";

import { useState, useEffect } from "react";
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
import { PenSquare, Trash2, Plus, FileSpreadsheet, Building2, Loader2, RefreshCcw, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRuanganData } from "@/hooks/useRuanganData";
import { useGuruData } from "@/hooks/useGuruData";
import { useJadwalData } from "@/hooks/useJadwalData";
import { getApiBaseUrl } from "@/lib/api-config";

const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
export default function AdminRuanganPage() {
    const currentUser = useAppStore(s => s.currentUser);
    const isKepalaSekolah = currentUser?.teacherCode === "1";
    const { ruangan: rooms, refetch: refetchRooms } = useRuanganData();
    const { guru: teachers, refetch: refetchTeachers } = useGuruData();

    // Status Simulation State
    const [isLiveMode, setIsLiveMode] = useState(true);
    const [simDay, setSimDay] = useState<number>(new Date().getDay() || 1);
    const [simTime, setSimTime] = useState<string>(() => {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    });

    // Handle Real-time Sync
    useEffect(() => {
        if (!isLiveMode) return;
        
        const updateNow = () => {
            const now = new Date();
            const currentDay = now.getDay() || 1; // Minggu (0) ke Senin (1)
            const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            // Hanya update jika berbeda untuk mencegah re-render berlebih
            setSimDay(prev => prev !== currentDay ? currentDay : prev);
            setSimTime(prev => prev !== currentTime ? currentTime : prev);
        };

        updateNow();
        const interval = setInterval(updateNow, 10000); // Cek tiap 10 detik
        return () => clearInterval(interval);
    }, [isLiveMode]);

    const dayName = DAY_NAMES[simDay] || "SENIN";
    const { jadwal: allSchedules } = useJadwalData(dayName);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<any>({ id: "", code: "", name: "", location: "Lantai 1", pic: "", pic_code: "" });

    const handleOpenDialog = (data: Partial<typeof formData> = { id: "", code: "", name: "", location: "Lantai 1", pic: "", pic_code: "" }) => {
        setFormData({
            id: data.id || "",
            code: data.code || "",
            name: data.name || "",
            location: data.location || "Lantai 1",
            pic: data.pic || "",
            pic_code: data.pic_code || ""
        });
        setEditMode(!!data.id);
        setIsDialogOpen(true);
    };

    const handleSaveRoom = async () => {
        if (!formData.name || !formData.code || !formData.location) return toast.error("Isi semua data ruangan");

        setIsSaving(true);
        try {
            const method = editMode ? "PUT" : "POST";
            const response = await fetch(`${getApiBaseUrl()}/ruangan/index.php`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.status === "success") {
                toast.success(data.message);
                setIsDialogOpen(false);
                refetchRooms();
                refetchTeachers();
            } else {
                toast.error(data.message || "Gagal menyimpan ruang");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan jaringan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoom = async (id: string | number, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) return;

        try {
            const response = await fetch(`${getApiBaseUrl()}/ruangan/index.php`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await response.json();
            if (data.status === "success") {
                toast.success(data.message);
                refetchRooms();
                refetchTeachers();
            } else {
                toast.error(data.message || "Gagal menghapus ruang");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan jaringan");
        }
    };

    const handleExport = () => {
        const worksheet = xlsx.utils.json_to_sheet(rooms);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data_Ruangan");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(data, "Data_Ruangan.xlsx");
        toast.success("Data berhasil diekspor");
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Ruangan</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Kelola data ruangan fisik sekolah sebagai penanggung jawab kegiatan pembelajaran.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button onClick={handleExport} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                    {!isKepalaSekolah && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Ruangan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editMode ? "Edit Ruangan" : "Tambah Ruangan Baru"}</DialogTitle>
                                    <DialogDescription>
                                        Formulir informasi ruangan fisik yang ada di sekolah.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="code" className="text-right">Kode</Label>
                                        <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} id="code" placeholder="Contoh: R001" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Nama Ruangan</Label>
                                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} id="name" placeholder="Contoh: Ruang Matematika" className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="location" className="text-right">Lokasi</Label>
                                        <Select value={formData.location || "Lantai 1"} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Pilih Lokasi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Lantai 1">Lantai 1</SelectItem>
                                                <SelectItem value="Lantai 2">Lantai 2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="pic" className="text-right">Penanggung Jawab</Label>
                                         <Select value={formData.pic_code || "Tidak ada"} onValueChange={(v) => {
                                             const selectedTeacher = teachers.find(t => t.teacherCode === v);
                                             setFormData({ 
                                                 ...formData, 
                                                 pic_code: v, 
                                                 pic: selectedTeacher ? selectedTeacher.name : "Tidak ada" 
                                             });
                                         }}>
                                             <SelectTrigger className="col-span-3">
                                                 <SelectValue placeholder="Pilih Penanggung Jawab" />
                                             </SelectTrigger>
                                             <SelectContent className="max-h-[200px] overflow-y-auto">
                                                 <SelectItem value="Tidak ada">Tidak ada (Kosongkan)</SelectItem>
                                                 {teachers.map((t) => {
                                                     const isTakenByOthers = !!(t.homebase && t.homebase !== "-" && t.homebase !== "" && t.homebase !== "Tidak ada" && t.homebase !== formData.name);
                                                     return (
                                                         <SelectItem key={t.id} value={t.teacherCode} disabled={isTakenByOthers}>
                                                             <div className="flex justify-between items-center w-full gap-4">
                                                                 <span>{t.name}</span>
                                                                 {isTakenByOthers && <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 italic">Terisi: {t.homebase}</span>}
                                                             </div>
                                                         </SelectItem>
                                                     );
                                                 })}
                                             </SelectContent>
                                         </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSaveRoom} disabled={isSaving} className="bg-[#000080] text-white py-2">
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Simpan"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center">
                            <Building2 className="w-5 h-5 mr-2" />
                            Data Ruangan (Penanggung Jawab & Peminjaman)
                        </CardTitle>
                        <CardDescription>Daftar fasilitas fisik. Status otomatis ter-update berdasarkan jadwal.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-4">
                            {!isLiveMode && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setIsLiveMode(true)}
                                    className="h-8 group text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 rounded-lg transition-all"
                                >
                                    <RefreshCcw className="w-3.5 h-3.5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Reset Ke Sekarang</span>
                                </Button>
                            )}
                            {isLiveMode && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Mode Real-time</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hari:</Label>
                                <Select 
                                    value={simDay.toString()} 
                                    onValueChange={(v) => {
                                        setSimDay(parseInt(v));
                                        setIsLiveMode(false);
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs w-[110px] font-semibold border-slate-200 focus:ring-blue-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1" className="text-xs">Senin</SelectItem>
                                        <SelectItem value="2" className="text-xs">Selasa</SelectItem>
                                        <SelectItem value="3" className="text-xs">Rabu</SelectItem>
                                        <SelectItem value="4" className="text-xs">Kamis</SelectItem>
                                        <SelectItem value="5" className="text-xs">Jumat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Jam:</Label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <Input 
                                        type="time" 
                                        value={simTime} 
                                        onChange={e => {
                                            setSimTime(e.target.value);
                                            setIsLiveMode(false);
                                        }} 
                                        className="h-8 text-xs w-[110px] pl-7 font-semibold border-slate-200 focus:ring-blue-100" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-[#000080]">Kode</TableHead>
                                <TableHead className="font-bold text-[#000080]">Nama Ruangan</TableHead>
                                <TableHead className="font-bold text-[#000080]">Lokasi</TableHead>
                                <TableHead className="font-bold text-[#000080]">Penanggung Jawab</TableHead>
                                <TableHead className="font-bold text-[#000080]">Status</TableHead>
                                {!isKepalaSekolah && <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Building2 className="w-10 h-10 opacity-20" />
                                            <p className="font-medium">Belum ada data ruangan.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : rooms.map((room) => {
                                const activeSchedule = allSchedules.find(s => {
                                    // Match by direct Room Code relationship (Preferred)
                                    if (s.room_code === room.code) return true;

                                    // Match by PIC legacy (If PIC is currently teaching)
                                    if (!room.pic || room.pic === "Tidak ada" || room.pic === "-") return false;
                                    if (s.teacher_name !== room.pic) return false;

                                    const [start, end] = s.time_range.split(' - ').map(t => t.replace('.', ':'));
                                    const simTimeH = simTime.replace('.', ':');
                                    
                                    return simTimeH >= start && simTimeH <= end;
                                });

                                const isUsed = !!activeSchedule;

                                return (
                                    <TableRow key={room.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono text-xs font-bold text-slate-500">{room.code}</TableCell>
                                        <TableCell className="font-bold text-slate-800 text-base">{room.name}</TableCell>
                                        <TableCell className="font-medium text-slate-700">{room.location}</TableCell>
                                        <TableCell className="font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                    {room.pic ? room.pic.charAt(0) : "?"}
                                                </div>
                                                <span>{room.pic || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isUsed ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-200 border uppercase tracking-wide">
                                                        Terpakai
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-medium">Kegiatan:</span>
                                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-100">
                                                        Kelas {activeSchedule?.class_name} - {activeSchedule?.subject_hint || activeSchedule?.teacher_mapel?.split(' (')[0]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        Tersedia
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 italic">Ruangan kosong di jam {simTime}</span>
                                                 </div>
                                            )}
                                        </TableCell>
                                        {!isKepalaSekolah && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button onClick={() => handleOpenDialog(room)} size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <PenSquare className="w-4 h-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDeleteRoom(room.id, room.name)} size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
