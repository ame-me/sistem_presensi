"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    ClipboardList,
    Users,
    BookOpen,
    FileText,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    TrendingUp,
    AlertCircle,
    Play
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function GuruDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const getSchedulesByTeacher = useAppStore((s) => s.getSchedulesByTeacher);
    const getClassesByTeacher = useAppStore((s) => s.getClassesByTeacher);
    const getPendingLeaveRequests = useAppStore((s) => s.getPendingLeaveRequests);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);

    if (!currentUser) return null;

    const schedules = getSchedulesByTeacher(currentUser.id);
    const classes = getClassesByTeacher(currentUser.id);
    const pendingLeave = getPendingLeaveRequests();
    const todayIndex = new Date().getDay();
    const todaySchedules = schedules.filter((s) => s.dayOfWeek === todayIndex);

    // Filter attendance for the current teacher's classes
    const teacherClassIds = new Set(classes.map(c => c.id));
    const teacherAttendance = attendanceRecords.filter(a => a.scheduleId && schedules.find(s => s.id === a.scheduleId));

    // Live Class Logic (Mock Implementation)
    const nowHour = new Date().getHours() + ":" + Math.floor(new Date().getMinutes() / 15) * 15; // Rough current time bucket
    const activeSchedule = todaySchedules[0]; // Mock active class
    const isLateAttendance = true; // Mock: 10 mins passed without attendance

    // Trend Chart Data (Mock 7 Days)
    const chartData = [
        { name: "Sen", hadir: 30, absen: 2 },
        { name: "Sel", hadir: 31, absen: 1 },
        { name: "Rab", hadir: 28, absen: 4 },
        { name: "Kam", hadir: 32, absen: 0 },
        { name: "Jum", hadir: 29, absen: 3 },
    ];

    const handleAcceptLeave = (id: string, name: string) => {
        toast.success(`Izin untuk ${name} telah disetujui.`);
    };

    const handleRejectLeave = (id: string, name: string) => {
        toast.error(`Izin untuk ${name} ditolak.`);
    };

    const stats = [
        {
            label: "Kelas Diajar",
            value: classes.length,
            icon: <BookOpen className="w-5 h-5" />,
            color: "bg-blue-50 text-[#000080]",
        },
        {
            label: "Jadwal Pelajaran",
            value: schedules.length,
            icon: <ClipboardList className="w-5 h-5" />,
            color: "bg-indigo-50 text-indigo-700",
        },
        {
            label: "Presensi Tercatat",
            value: attendanceRecords.length,
            icon: <Users className="w-5 h-5" />,
            color: "bg-emerald-50 text-[#10B981]",
        },
        {
            label: "Perlu Verifikasi",
            value: pendingLeave.length,
            icon: <FileText className="w-5 h-5" />,
            color: "bg-amber-50 text-[#F59E0B]",
        },
    ];

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
                        Halo, {currentUser.name} 👋
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]"></span>
                        SIPANDU - SMPK SANTA MARIA 2 • {new Date().toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#000080]">
                    <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 italic">Guru Aktif</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-800 mt-2 group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.color} transition-transform group-hover:rotate-6 shadow-sm`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pending leave alert */}
            {pendingLeave.length > 0 && (
                <Link href="/guru/izin">
                    <Card className="bg-amber-50 border-amber-200 hover:border-amber-400 transition-all cursor-pointer shadow-sm group">
                        <CardContent className="py-5 px-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md rotate-3 group-hover:rotate-0 transition-all">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-amber-900">
                                        Perhatian: {pendingLeave.length} Pengajuan Izin
                                    </p>
                                    <p className="text-sm text-amber-700 font-medium">
                                        Ada permohonan yang memerlukan evaluasi Anda segera.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/50 p-2 rounded-full border border-amber-200">
                                <ChevronRight className="w-5 h-5 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Live Class Widget */}
            {activeSchedule && (
                <Card className={`border-2 shadow-md ${isLateAttendance ? 'bg-amber-50 border-amber-300' : 'bg-blue-50 border-blue-200'}`}>
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isLateAttendance ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} animate-pulse`}>
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">Kelas Berjalan Saat Ini</p>
                                <h3 className={`text-2xl font-black ${isLateAttendance ? 'text-amber-900' : 'text-[#000080]'}`}>
                                    {activeSchedule.className} - {activeSchedule.subjectName}
                                </h3>
                                <p className={`text-sm font-medium mt-1 ${isLateAttendance ? 'text-amber-700' : 'text-blue-700'}`}>
                                    Waktu: {activeSchedule.startTime}
                                    {isLateAttendance && " (Belum melakukan presensi!)"}
                                </p>
                            </div>
                        </div>
                        <Link href={`/guru/presensi?classId=${activeSchedule.classId}&scheduleId=${activeSchedule.id}`}>
                            <Button size="lg" className={`${isLateAttendance ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#000080] hover:bg-blue-900'} text-white font-bold shadow-lg animate-bounce`}>
                                <Play className="w-5 h-5 mr-2" />
                                Mulai Presensi Sekarang
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Today's Schedule */}
            <Card className="border-slate-200 bg-white shadow-md rounded-2xl">
                <CardHeader className="border-b border-slate-50 px-8 py-6">
                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        Jadwal Mengajar Hari Ini — {DAY_NAMES[todayIndex]}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    {todaySchedules.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {todaySchedules.map((sch) => (
                                <Link
                                    key={sch.id}
                                    href={`/guru/presensi?classId=${sch.classId}&scheduleId=${sch.id}`}
                                >
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#000080] hover:bg-white hover:shadow-lg hover:shadow-blue-900/5 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-5">
                                            <div className="text-center px-4 py-3 bg-[#000080] text-white rounded-xl min-w-[100px] shadow-sm group-hover:-translate-y-1 transition-transform">
                                                <p className="text-xs font-bold opacity-80 uppercase leading-none mb-1">Pukul</p>
                                                <p className="text-sm font-black italic">{sch.startTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-800 group-hover:text-[#000080] transition-colors leading-tight">
                                                    {sch.subjectName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-white text-slate-500 font-bold border-slate-200">
                                                        {sch.className}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2 text-[#000080] font-bold text-sm bg-blue-50 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            Isi Presensi <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ClipboardList className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-lg font-bold text-slate-800">Tidak ada jadwal hari ini</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-[250px]">
                                Nikmati waktu istirahat sejenak atau selesaikan tugas administratif lainnya.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Verification Center & Teacher's Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel Persetujuan Izin & Sakit */}
                <Card className="border-slate-200 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Persetujuan Izin & Sakit
                        </CardTitle>
                        <CardDescription>Persetujuan cepat permohonan dari wali murid</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Siswa</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLeave.length > 0 ? pendingLeave.slice(0, 3).map((req, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <p className="font-bold text-slate-800 text-sm">{req.studentName}</p>
                                            <p className="text-[10px] text-slate-500">NIS: {req.studentNis}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={req.type === 'SAKIT' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'}>{req.type}</Badge>
                                            <p className="text-xs mt-1 text-slate-600 truncate max-w-[150px]">{req.reason}</p>
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-8 w-8 text-slate-600 hover:text-[#000080]" title="Lihat Bukti">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[400px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Bukti Selfie & Surat</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
                                                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${req.id}`} alt="Bukti" className="object-cover opacity-50" />
                                                            <div className="absolute inset-0 flex items-center justify-center"><p className="text-slate-500 font-bold bg-white/80 px-3 py-1 rounded">Simulasi Bukti Foto</p></div>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700">Pesan: "{req.reason}"</p>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button onClick={() => handleAcceptLeave(req.id, req.studentName)} size="icon" className="h-8 w-8 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={() => handleRejectLeave(req.id, req.studentName)} size="icon" className="h-8 w-8 bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">Tidak ada pengajuan perizinan baru.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Ringkasan Kehadiran Kelas */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Tren Kehadiran (7 Hari Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="hadir" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} name="Hadir" />
                                    <Bar dataKey="absen" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Absen/Izin" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 shadow-sm bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-red-800 text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Siswa Perhatian Khusus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { name: "Chandra Wijaya", class: "7B", issue: "3x Alpha berturut-turut" },
                                    { name: "Dewi Kirana", class: "8A", issue: "Sering Terlambat > 15 mnt" },
                                ].map((siswa, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{siswa.name}</p>
                                            <p className="text-xs text-red-600 font-medium">{siswa.issue}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-slate-50">{siswa.class}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
