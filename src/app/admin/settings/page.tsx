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

export default function AdminSettingsPage() {
    const [waStatus, setWaStatus] = useState<"connected" | "disconnected">("connected");

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Pengaturan Sistem</h1>
                <p className="text-slate-500 font-medium mt-1">
                    Konfigurasi global aplikasi SIPANDU, integrasi WhatsApp, dan manajemen akses.
                </p>
            </div>

            <Tabs defaultValue="school" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="school" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <School className="w-4 h-4 mr-2" />
                        Identitas Sekolah
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp API
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <Clock className="w-4 h-4 mr-2" />
                        Aturan Presensi
                    </TabsTrigger>
                    <TabsTrigger value="access" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <Shield className="w-4 h-4 mr-2" />
                        Akses & User
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <Database className="w-4 h-4 mr-2" />
                        Backup & Data
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: IDENTITAS SEKOLAH */}
                <TabsContent value="school" className="space-y-6">
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
                                    <Select defaultValue="2025/2026">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2024/2025">2024 / 2025</SelectItem>
                                            <SelectItem value="2025/2026">2025 / 2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Semester Aktif</Label>
                                    <Select defaultValue="ganjil">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ganjil">Ganjil</SelectItem>
                                            <SelectItem value="genap">Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                            <Button className="bg-[#000080] text-white font-bold">
                                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* TAB 2: WHATSAPP API */}
                <TabsContent value="whatsapp" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Connection Status */}
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-green-50 border-b border-green-100">
                                <CardTitle className="text-green-800 text-base font-bold flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    Status Koneksi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 text-center space-y-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${waStatus === 'connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {waStatus === 'connected' ? <Link className="w-8 h-8" /> : <Unlink className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">
                                        {waStatus === 'connected' ? 'Terhubung' : 'Terputus'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {waStatus === 'connected' ? 'Gateway Fontee siap mengirim pesan.' : 'Mohon periksa token API Anda.'}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setWaStatus(waStatus === 'connected' ? 'disconnected' : 'connected')}>
                                    <RefreshCw className="w-3 h-3 mr-2" /> Cek Koneksi
                                </Button>
                            </CardContent>
                        </Card>

                        {/* API Configuration */}
                        <Card className="md:col-span-2 border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Instansi & Token</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Fontee API Token</Label>
                                    <div className="flex gap-2">
                                        <Input type="password" value="************************" readOnly className="font-mono bg-slate-50" />
                                        <Button variant="outline">Ubah</Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Jangan bagikan token ini kepada siapapun.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nomor Pengirim (Sender ID)</Label>
                                    <Input value="6281234567890 (SIPANDU BOT)" readOnly className="bg-slate-50" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Templates */}
                        <Card className="md:col-span-3 border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-[#000080] text-base font-bold">Template Pesan Otomatis</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex justify-between">
                                        <span>Notifikasi Alpha (Tanpa Keterangan)</span>
                                        <Badge variant="outline" className="text-[10px]">Aktif</Badge>
                                    </Label>
                                    <Textarea rows={4} className="text-xs font-mono" defaultValue="Yth. Orang Tua dari [nama_siswa], kami menginfokan bahwa anak Bapak/Ibu tidak hadir pada mata pelajaran [mapel] jam ke-[jam] tanpa keterangan. Mohon konfirmasinya. Terima kasih. - SIPANDU SMPK Santa Maria 2" />
                                    <p className="text-[10px] text-slate-400">Variabel: [nama_siswa], [mapel], [jam], [tanggal]</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex justify-between">
                                        <span>Notifikasi Terlambat</span>
                                        <Badge variant="outline" className="text-[10px]">Aktif</Badge>
                                    </Label>
                                    <Textarea rows={4} className="text-xs font-mono" defaultValue="Yth. Orang Tua, Siswa atas nama [nama_siswa] tercatat masuk kelas [mapel] TERLAMBAT [durasi] menit pada jam pelajaran ke-[jam]. Mohon pembinaannya di rumah. Terima kasih." />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: ATTENDANCE RULES */}
                <TabsContent value="attendance" className="space-y-6">
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
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: ACCESS & USER */}
                <TabsContent value="access" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <CardTitle className="text-[#000080] text-lg font-bold">Manajemen User</CardTitle>
                            <Input placeholder="Cari User..." className="w-full md:w-64 bg-white" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3 text-sm text-amber-800">
                                <AlertCircle className="w-4 h-4" />
                                <span>Reset Password akan mengubah password user menjadi default: <b>guru123</b></span>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Nama User</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Terakhir Login</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { name: "Administrator", role: "SUPER ADMIN", last: "Sedang Aktif" },
                                        { name: "Budi Santoso", role: "GURU (Wali Kelas)", last: "2 jam lalu" },
                                        { name: "Siti Aminah", role: "GURU", last: "Kemarin" },
                                    ].map((u, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-bold text-slate-700">{u.name}</td>
                                            <td className="px-6 py-3">
                                                <Badge variant="outline">{u.role}</Badge>
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 font-mono text-xs">{u.last}</td>
                                            <td className="px-6 py-3 text-right">
                                                <Button size="sm" variant="ghost" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                                    <KeyRound className="w-3 h-3 mr-1" /> Reset Pass
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: BACKUP & DATA */}
                <TabsContent value="backup" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-blue-900 text-base font-bold flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Ekspor Database
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Unduh salinan lengkap database (SQL) untuk keperluan arsip atau pemindahan server.
                                </p>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                    Download Backup (.sql)
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-red-50 border-b border-red-100">
                                <CardTitle className="text-red-900 text-base font-bold flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    Maintenance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Hapus log notifikasi dan data sampah lainnya untuk menjaga performa sistem.
                                </p>
                                <Button variant="destructive" className="w-full font-bold">
                                    Bersihkan Cache & Log Lama
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
