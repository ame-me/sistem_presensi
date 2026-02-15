"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardList,
    Users,
    BookOpen,
    FileText,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

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

    const stats = [
        {
            label: "Kelas Diajar",
            value: classes.length,
            icon: <BookOpen className="w-5 h-5" />,
            color: "bg-blue-500/10 text-blue-400",
        },
        {
            label: "Jadwal Pelajaran",
            value: schedules.length,
            icon: <ClipboardList className="w-5 h-5" />,
            color: "bg-emerald-500/10 text-emerald-400",
        },
        {
            label: "Presensi Tercatat",
            value: attendanceRecords.length,
            icon: <Users className="w-5 h-5" />,
            color: "bg-violet-500/10 text-violet-400",
        },
        {
            label: "Izin Pending",
            value: pendingLeave.length,
            icon: <FileText className="w-5 h-5" />,
            color: "bg-amber-500/10 text-amber-400",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Halo, {currentUser.name} 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-slate-900/50 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color}`}>
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
                    <Card className="bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer">
                        <CardContent className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-400">
                                        {pendingLeave.length} pengajuan izin menunggu review
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Klik untuk mereview
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-amber-400" />
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Today's Schedule */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-base flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                        Jadwal Hari Ini — {DAY_NAMES[todayIndex]}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {todaySchedules.length > 0 ? (
                        <div className="space-y-2">
                            {todaySchedules.map((sch) => (
                                <Link
                                    key={sch.id}
                                    href={`/guru/presensi?classId=${sch.classId}&scheduleId=${sch.id}`}
                                >
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center px-3 py-2 bg-blue-500/10 rounded-lg min-w-[80px]">
                                                <p className="text-xs text-blue-400">{sch.startTime}</p>
                                                <p className="text-xs text-slate-500">{sch.endTime}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                    {sch.subjectName}
                                                </p>
                                                <p className="text-sm text-slate-400">{sch.className}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20">
                                            Input Presensi
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">
                            Tidak ada jadwal hari ini
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
