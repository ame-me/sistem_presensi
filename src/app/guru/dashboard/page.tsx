"use client";

import { useState, useEffect } from "react";
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
    Play,
    Bell,
    Loader2,
    Camera,
    FileImage,
    Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useJadwalData } from "@/hooks/useJadwalData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData, reviewIzinAPI } from "@/hooks/useIzinData";
import { useNotificationData } from "@/hooks/useNotificationData";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_MAP: Record<string, number> = {
    "SENIN": 1, "SELASA": 2, "RABU": 3, "KAMIS": 4, "JUMAT": 5, "SABTU": 6
};

export default function GuruDashboardPage() {
    const router = useRouter();
    const currentUser = useAppStore((s) => s.currentUser);
    const today = new Date().toISOString().split("T")[0];

    const [mounted, setMounted] = useState(false);
    const [navigatingId, setNavigatingId] = useState<number | null>(null);

    // Fetch REAL data from database
    const { jadwal: rawJadwal, loading: loadingJadwal } = useJadwalData(undefined, undefined, currentUser?.teacherCode);
    
    // We look back 5 days for trend data
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
    const startDate = fiveDaysAgo.toISOString().split("T")[0];
    
    const { attendance: todayRecords } = useAttendanceData(today, currentUser?.teacherCode);
    const { attendance: historyRecords } = useAttendanceData(undefined, currentUser?.teacherCode, undefined, startDate, today);
    const { izin: allIzin, loading: loadingIzin, refetch: refetchIzin } = useIzinData();
    const { notifications, refetch: refetchNotif } = useNotificationData(currentUser?.teacherCode);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGoToAttendance = async (notif: any) => {
        setNavigatingId(notif.id);
        try {
            const res = await fetch("http://127.0.0.1/presensipander/api/notifikasi/index.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: notif.id, action: "dismiss" })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                refetchNotif();
                if (notif.schedule_id) {
                    router.push(`/guru/presensi?scheduleId=${notif.schedule_id}&date=${notif.date}`);
                }
            } else {
                toast.error("Gagal memproses notifikasi");
                setNavigatingId(null);
            }
        } catch (e) {
            console.error("Navigation failed", e);
            toast.error("Terjadi kesalahan sistem");
            setNavigatingId(null);
        }
    };

    if (!currentUser || !mounted) return null;

    // Map JadwalItem to UI format
    const schedules = rawJadwal.map(j => ({
        id: j.id.toString(),
        rombelId: j.class_name,
        className: j.class_name,
        subjectName: j.subject_hint || j.teacher_mapel?.split(' (')[0] || "Mata Pelajaran",
        startTime: j.time_range.split(' - ')[0],
        endTime: j.time_range.split(' - ')[1],
        dayOfWeek: DAY_MAP[j.day] || 0
    }));

    const rombels = Array.from(new Set(schedules.map(s => s.className))).map(name => ({ id: name, name }));
    const pendingLeave = allIzin.filter((i: any) => i.status === "PENDING");
    const approvedLeave = allIzin.filter((i: any) => i.status === "APPROVED");
    const isGuru = currentUser?.role === 'GURU';
    
    const todayIndex = new Date().getDay();
    const todaySchedulesRaw = (schedules || []).filter((s) => {
        // Robust day matching: handle cases where DB has "KAMIS " or "kamis"
        const targetDayName = DAY_NAMES[todayIndex].toUpperCase();
        const schedDayUpper = rawJadwal.find(j => j.id.toString() === s.id)?.day?.trim()?.toUpperCase() || "";
        return s.dayOfWeek === todayIndex || schedDayUpper === targetDayName;
    });

    // Grouping consecutive sessions
    const groupedSchedules = todaySchedulesRaw.reduce((acc: any[], sch) => {
        const last = acc[acc.length - 1];
        if (last && last.className === sch.className && last.subjectName === sch.subjectName) {
            last.ids.push(sch.id);
            last.endTime = sch.endTime;
            last.totalHours += 1;
            return acc;
        }
        acc.push({ ...sch, ids: [sch.id], totalHours: 1 });
        return acc;
    }, []).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const todaySchedules = groupedSchedules;
    
    // Time check for active class
    const now = new Date();
    const currentStr = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;
    const activeSchedule = todaySchedules.find(s => currentStr <= s.endTime);
    
    const isLateAttendance = !!(activeSchedule && 
        currentStr >= activeSchedule.startTime && 
        !todayRecords.some((r: any) => activeSchedule.ids.includes(r.schedule_id?.toString())));

    // Chart Data formatting
    const chartData = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (4 - i));
        const dStr = d.toISOString().split("T")[0];
        const dayNamesIndoShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const dayLabel = dayNamesIndoShort[d.getDay()];
        
        const dayRecords = (historyRecords || []).filter((r: any) => r.date === dStr);
        return {
            name: dayLabel,
            hadir: dayRecords.filter((r: any) => r.status === 'HADIR').length,
            absen: dayRecords.filter((r: any) => r.status !== 'HADIR').length,
        };
    });

    const handleAcceptLeave = async (id: string, name: string) => {
        const res = await reviewIzinAPI(Number(id), 'APPROVED', 'Disetujui oleh Guru', currentUser?.name || 'Guru');
        if (res.status === 'success') {
            toast.success(`Izin untuk ${name} telah disetujui.`);
            refetchIzin();
        } else {
            toast.error(`Gagal menyetujui izin.`);
        }
    };

    const handleRejectLeave = async (id: string, name: string) => {
        const res = await reviewIzinAPI(Number(id), 'REJECTED', 'Ditolak oleh Guru', currentUser?.name || 'Guru');
        if (res.status === 'success') {
            toast.error(`Izin untuk ${name} ditolak.`);
            refetchIzin();
        } else {
            toast.error(`Gagal menolak izin.`);
        }
    };

    const stats = [
        { label: "Kelas Diajar", value: rombels.length, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-50 text-[#000080]" },
        { label: "Jadwal Pelajaran", value: schedules.length, icon: <ClipboardList className="w-5 h-5" />, color: "bg-indigo-50 text-indigo-700" },
        { label: "Presensi Tercatat", value: todayRecords.length, icon: <Users className="w-5 h-5" />, color: "bg-emerald-50 text-[#10B981]" },
        { label: isGuru ? "Total Dispensasi" : "Perlu Verifikasi", value: isGuru ? approvedLeave.length : pendingLeave.length, icon: <FileText className="w-5 h-5" />, color: isGuru ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-[#F59E0B]" },
    ];

    return (
        <div className="space-y-8 font-sans">
            {/* Header section with Dynamic Date string rendered on client */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
                        Halo, {currentUser.name} 👋
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]"></span>
                        SIPANDU - SMPK SANTA MARIA 2 • {new Date().toLocaleDateString("id-ID", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#000080]">
                    <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 italic">Guru Aktif</span>
                </div>
            </div>

            {/* Stats Cards */}
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

            {/* Notifications and Alerts */}
            {notifications.length > 0 && (
                <div className="space-y-3">
                    {notifications.map((notif: any) => (
                        <Card key={notif.id} className="bg-red-50 border-red-200 shadow-sm border-l-4 border-l-red-500 animate-in fade-in slide-in-from-top-4 duration-500">
                            <CardContent className="py-4 px-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <Bell className="w-5 h-5 animate-ring" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-red-900 uppercase tracking-tighter">Peringatan Admin</p>
                                        <p className="text-sm text-red-700 font-bold">{notif.message}</p>
                                    </div>
                                </div>
                                <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] h-9 px-6 shadow-md" onClick={() => handleGoToAttendance(notif)} disabled={navigatingId === notif.id}>
                                    {navigatingId === notif.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "ISI PRESENSI SEKARANG"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Active Class Widget */}
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
                                    Waktu: {activeSchedule.startTime} {isLateAttendance && " (Belum melakukan presensi!)"}
                                </p>
                            </div>
                        </div>
                        <Link href={`/guru/presensi?rombelId=${activeSchedule.rombelId}&scheduleId=${activeSchedule.ids.join(',')}`}>
                            <Button size="lg" className={`${isLateAttendance ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#000080] hover:bg-blue-900'} text-white font-bold shadow-lg animate-bounce`}>
                                <Play className="w-5 h-5 mr-2" /> Mulai Presensi Sekarang
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Today's Schedule Card */}
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
                                <Link key={sch.ids.join('-')} href={`/guru/presensi?rombelId=${sch.rombelId}&scheduleId=${sch.ids.join(',')}`}>
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#000080] hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                                        <div className="flex items-center gap-5">
                                            <div className="text-center px-4 py-3 bg-[#000080] text-white rounded-xl min-w-[100px] shadow-sm group-hover:-translate-y-1 transition-transform">
                                                <p className="text-xs font-bold opacity-80 uppercase leading-none mb-1">Pukul</p>
                                                <p className="text-sm font-black italic">{sch.startTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-800 group-hover:text-[#000080] transition-colors leading-tight">{sch.subjectName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-white text-slate-500 font-bold border-slate-200">{sch.className}</Badge>
                                                    {sch.totalHours > 1 && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-[#000080] font-black border-none px-2 text-[10px]">
                                                            {sch.totalHours} JAM PEL
                                                        </Badge>
                                                    )}
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
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Leave Verification Panel */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="border-slate-200 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Daftar Izin & Sakit Siswa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Siswa</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right px-6">Detail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLeave.length > 0 ? pendingLeave.slice(0, 5).map((req, i) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="px-6">
                                            <p className="font-bold text-slate-800 text-sm">{req.student_name || req.studentName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SISWA AKTIF</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={req.type === 'SAKIT' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200'}>
                                                {req.type === 'SAKIT' ? '🤒 SAKIT' : '📋 IZIN'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2 px-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-[#000080] hover:bg-blue-50 font-bold">
                                                        <Eye className="w-4 h-4 mr-1.5" /> Lihat Detail
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-white border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden">
                                                    <DialogHeader className="bg-slate-50 p-6 border-b border-slate-100">
                                                        <DialogTitle className="text-lg font-black text-[#000080] tracking-tight">
                                                            Lampiran Bukti — {req.student_name || req.studentName}
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="p-8 bg-slate-50/30">
                                                        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                                                            <p className="text-sm font-bold text-[#000080] mb-2 uppercase tracking-widest flex items-center gap-2">
                                                                <Info className="w-4 h-4" /> Detail Alasan
                                                            </p>
                                                            <p className="text-slate-600 leading-relaxed font-medium">
                                                                {req.reason || "Tidak ada keterangan tambahan."}
                                                            </p>
                                                            {isGuru && (
                                                                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                    <p className="text-xs font-bold text-amber-800">Persetujuan izin hanya oleh Admin Tata Usaha.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!isGuru && (
                                                        <div className="p-6 bg-white flex justify-end gap-3">
                                                            <Button onClick={() => handleAcceptLeave(req.id, req.student_name || req.studentName)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg">Setujui Izin</Button>
                                                            <Button onClick={() => handleRejectLeave(req.id, req.student_name || req.studentName)} variant="outline" className="text-red-600 border-red-100 hover:bg-red-50 font-bold h-11 px-8 rounded-xl">Tolak</Button>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-slate-400 font-medium">Semua permohonan terkontrol.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
