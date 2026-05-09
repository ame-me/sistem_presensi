"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Settings,
    School,
    MessageSquare,
    Clock,
    Shield,
    Database,
    Save,
    RefreshCw,
    Smartphone,
    Link,
    Unlink,
    AlertCircle,
    UserCog,
    KeyRound,
    Trash2,
    Download,
    Upload,
    Bell
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { toast } from "sonner";
export default function AdminSettingsPage() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const setSelectedTahunAjaran = useAppStore((s) => s.setSelectedTahunAjaran);

    // Parse existing year and semester from global state (e.g. "2025/2026 Genap")
    const parts = selectedTahunAjaran ? selectedTahunAjaran.split(" ") : ["2025/2026", "Ganjil"];
    const [yearPart, setYearPart] = useState(parts[0]);
    const [semesterPart, setSemesterPart] = useState(parts[1]);

    useEffect(() => {
        if (selectedTahunAjaran) {
            const p = selectedTahunAjaran.split(" ");
            setYearPart(p[0]);
            setSemesterPart(p[1] || "Ganjil");
        }
    }, [selectedTahunAjaran]);

    const handleSaveYear = () => {
        const newValue = `${yearPart} ${semesterPart}`;
        setSelectedTahunAjaran(newValue);
        toast.success(`Tahun Ajaran Aktif diubah ke ${newValue}`);
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header Area */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Pengaturan Sistem</h1>
                <p className="text-slate-500 font-medium mt-1">
                    Konfigurasi global akademik sekolah dan aturan presensi.
                </p>
            </div>

            <Tabs defaultValue="school" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="school" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 transition-all">
                        <School className="w-4 h-4 mr-2" />
                        Identitas Sekolah
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 transition-all">
                        <Clock className="w-4 h-4 mr-2" />
                        Aturan Presensi
                    </TabsTrigger>
                </TabsList>

                {/* ===================== KONTEN ADMIN BIASA ===================== */}
                <TabsContent value="school" className="space-y-6 animate-in slide-in-from-bottom-2">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden max-w-4xl">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-[#000080] text-lg font-bold">Profil Sekolah & Tahun Ajaran</CardTitle>
                            <CardDescription>Informasi ini akan ditampilkan pada kop laporan dan dashboard user.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Nama Sekolah</Label>
                                    <Input defaultValue="SMPK SANTA MARIA 2" />
                                </div>
                                <div className="space-y-2">
                                    <Label>NPSN</Label>
                                    <Input defaultValue="20532xxx" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Alamat Lengkap</Label>
                                    <Textarea defaultValue="Jl. Raya Malang No. 123, Jawa Timur" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tahun Ajaran Aktif</Label>
                                    <Select value={yearPart} onValueChange={setYearPart}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2024/2025">2024 / 2025</SelectItem>
                                            <SelectItem value="2025/2026">2025 / 2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Semester Aktif</Label>
                                    <Select value={semesterPart} onValueChange={setSemesterPart}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ganjil">Ganjil</SelectItem>
                                            <SelectItem value="Genap">Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                            <Button className="bg-[#000080] text-white font-bold" onClick={handleSaveYear}>
                                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Manajemen Waktu</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Durasi Jam Pelajaran</Label>
                                        <p className="text-xs text-slate-500">Waktu efektif belajar per 1 JP.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" className="w-20 text-center" defaultValue={40} />
                                        <span className="text-sm font-bold text-slate-600">Menit</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-amber-600">Toleransi Keterlambatan</Label>
                                        <p className="text-xs text-slate-500">Batas waktu status "Hadir" vs "Terlambat".</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" className="w-20 text-center" defaultValue={15} />
                                        <span className="text-sm font-bold text-slate-600">Menit</span>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label>Hari Sekolah Aktif</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                                            <Badge key={day} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 cursor-pointer">{day}</Badge>
                                        ))}
                                        {['Sabtu', 'Minggu'].map(day => (
                                            <Badge key={day} variant="outline" className="text-slate-400 border-slate-200 cursor-pointer hover:bg-slate-50">{day}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                                <Button className="bg-[#000080] text-white">Simpan Waktu</Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Konfigurasi Izin Online</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Wajib Upload Selfie</Label>
                                        <p className="text-xs text-slate-500">Orang tua harus melampirkan foto bukti.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Batas Waktu Input Izin</Label>
                                        <p className="text-xs text-slate-500">Form ditutup setelah jam tertentu.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input type="time" className="w-28 text-center" defaultValue="08:00" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Otoritas Validasi Izin</Label>
                                    <Select defaultValue="wali">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="wali">Wali Kelas Saja</SelectItem>
                                            <SelectItem value="admin">Admin / Piket Saja</SelectItem>
                                            <SelectItem value="both">Wali Kelas & Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                                <Button className="bg-[#000080] text-white">Simpan Izin</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
