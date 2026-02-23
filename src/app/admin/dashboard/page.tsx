"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Users,
    GraduationCap,
    BookOpen,
    School,
    ClipboardCheck,
    Wifi,
    WifiOff,
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const students = useAppStore((s) => s.students);
    const classes = useAppStore((s) => s.classes);
    const subjects = useAppStore((s) => s.subjects);
    const users = useAppStore((s) => s.users);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const leaveRequests = useAppStore((s) => s.leaveRequests);
    const schedules = useAppStore((s) => s.schedules);

    if (!currentUser) return null;

    const teacherCount = users.filter((u) => u.role === "GURU").length;

    // Attendance summary
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = attendanceRecords.filter((a) => a.date === today);
    const statusCount = (status: string) => todayRecords.filter((a) => a.status === status).length;

    // Pending Permissions
    const pendingPermissions = leaveRequests.filter(req => req.status === "PENDING");

    // WA Status (Mock)
    const waStatus = "connected"; // or 'disconnected'

    // Classes without attendance (Mock logic - in real app would compare current time vs schedule time)
    // For now, let's find schedules for TODAY that don't have attendance records
    const todayDayOfWeek = new Date().getDay(); // 0-6
    const todaySchedules = schedules.filter(s => s.dayOfWeek === todayDayOfWeek);

    // Group attendance by scheduleId
    const attendanceBySchedule = new Set(todayRecords.map(r => r.scheduleId));

    // Schedules that missed attendance
    const missedAttendanceClasses = todaySchedules.filter(s => !attendanceBySchedule.has(s.id));

    // Chart Data (Mock trend for last 5 days)
    const chartData = [
        { name: "Senin", hadir: 95, izin: 2, sakit: 1, alpha: 2 },
        { name: "Selasa", hadir: 92, izin: 3, sakit: 2, alpha: 3 },
        { name: "Rabu", hadir: 98, izin: 1, sakit: 0, alpha: 1 },
        { name: "Kamis", hadir: 94, izin: 2, sakit: 3, alpha: 1 },
        { name: "Jumat (Hari Ini)", hadir: statusCount("HADIR") || 90, izin: statusCount("IZIN") || 5, sakit: statusCount("SAKIT") || 2, alpha: statusCount("ALPHA") || 3 },
    ];

    const stats = [
        {
            label: "Total Siswa",
            value: students.length,
            icon: <GraduationCap className="w-5 h-5 text-white" />,
            bgColor: "bg-[#000080] shadow-blue-900/10",
        },
        {
            label: "Total Guru",
            value: teacherCount,
            icon: <Users className="w-5 h-5 text-white" />,
            bgColor: "bg-indigo-600 shadow-indigo-900/10",
        },
        {
            label: "Total Kelas",
            value: classes.length,
            icon: <School className="w-5 h-5 text-white" />,
            bgColor: "bg-emerald-600 shadow-emerald-900/10",
        },
        {
            label: "Mata Pelajaran",
            value: subjects.length,
            icon: <BookOpen className="w-5 h-5 text-white" />,
            bgColor: "bg-amber-500 shadow-amber-900/10",
        },
    ];

    const attendanceStats = [
        { label: "Hadir", count: statusCount("HADIR"), bg: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20", icon: "✅" },
        { label: "Izin", count: statusCount("IZIN"), bg: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20", icon: "📋" },
        { label: "Sakit", count: statusCount("SAKIT"), bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "🤒" },
        { label: "Alpha", count: statusCount("ALPHA"), bg: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20", icon: "❌" },
        { label: "Terlambat", count: statusCount("TERLAMBAT"), bg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: "⏰" },
        { label: "Tugas", count: statusCount("KEPERLUAN_SEKOLAH"), bg: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: "🏫" },
    ];

    const handleRemind = (clsName: string, subjName: string) => {
        toast.success(`Pesan pengingat dikirim ke pengampu ${clsName} (${subjName}) via Fontee API`);
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Dashboard Admin</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        SIPANDU - SMPK SANTA MARIA 2 •{" "}
                        <span className="font-semibold text-slate-700">
                            {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </p>
                </div>

                {/* WA Status Indicator */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${waStatus === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {waStatus === 'connected' ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                        WA Gateway: {waStatus === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                {stat.icon}
                            </div>
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-xl shadow-lg ${stat.bgColor} transform group-hover:rotate-6 transition-all duration-300`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Attendance & Chart (2/3 width) */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Attendance Today */}
                    <Card className="bg-white border-slate-200 shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                            <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <ClipboardCheck className="w-6 h-6 text-[#000080]" />
                                </div>
                                Ringkasan Presensi Hari Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {attendanceStats.map((stat) => (
                                    <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform duration-300 cursor-default`}>
                                        <div className="text-2xl filter drop-shadow-sm mb-1">{stat.icon}</div>
                                        <p className="text-2xl font-black tracking-tight">{stat.count}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance Trend Chart */}
                    <Card className="bg-white border-slate-200 shadow-md rounded-2xl">
                        <CardHeader className="px-8 py-6">
                            <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                Tren Kehadiran Minggu Ini
                            </CardTitle>
                            <CardDescription>Grafik perbandingan status kehadiran siswa 5 hari terakhir.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="hadir" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} name="Hadir" />
                                    <Bar dataKey="izin" stackId="a" fill="#F59E0B" name="Izin" />
                                    <Bar dataKey="sakit" stackId="a" fill="#3B82F6" name="Sakit" />
                                    <Bar dataKey="alpha" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Alpha" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Alerts & Widgets (1/3 width) */}
                <div className="space-y-8">
                    {/* Verification Widget */}
                    <Link href="/admin/verifikasi">
                        <Card className="border-amber-200 bg-amber-50 shadow-md hover:shadow-lg transition-all cursor-pointer group rounded-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-amber-800 text-lg font-bold flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 animate-pulse" />
                                    Perlu Verifikasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-black text-amber-600 tracking-tighter">{pendingPermissions.length}</span>
                                    <span className="text-sm font-bold text-amber-700 mb-2 uppercase tracking-wide">Pengajuan</span>
                                </div>
                                <p className="text-sm text-amber-700/80 font-medium">Permohonan izin/sakit dari wali murid menunggu persetujuan Anda.</p>
                                <div className="mt-4 flex items-center text-xs font-bold text-amber-800 uppercase tracking-wider group-hover:underline">
                                    Lihat Detail <ChevronRight className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Classes without Attendance Widget */}
                    <Card className="bg-white border-slate-200 shadow-md rounded-2xl">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-slate-400" />
                                Belum Presensi (Hari Ini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {missedAttendanceClasses.length > 0 ? (
                                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                    {missedAttendanceClasses.map((s, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{s.className}</p>
                                                <p className="text-xs text-slate-500 font-medium">{s.subjectName}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{s.startTime}</p>
                                                <button onClick={() => handleRemind(s.className, s.subjectName)} className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 px-2 py-0.5 rounded font-bold transition-colors">
                                                    Ingatkan
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-slate-800 font-bold">Semua Aman!</p>
                                    <p className="text-xs text-slate-500 mt-1">Semua kelas terjadwal sudah melakukan presensi.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
