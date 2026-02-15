"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    GraduationCap,
    BookOpen,
    School,
    ClipboardCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const students = useAppStore((s) => s.students);
    const classes = useAppStore((s) => s.classes);
    const subjects = useAppStore((s) => s.subjects);
    const users = useAppStore((s) => s.users);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);

    if (!currentUser) return null;

    const teacherCount = users.filter((u) => u.role === "GURU").length;

    // Attendance summary
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = attendanceRecords.filter((a) => a.date === today);
    const statusCount = (status: string) => todayRecords.filter((a) => a.status === status).length;

    const stats = [
        {
            label: "Total Siswa",
            value: students.length,
            icon: <GraduationCap className="w-5 h-5" />,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-400",
        },
        {
            label: "Total Guru",
            value: teacherCount,
            icon: <Users className="w-5 h-5" />,
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-400",
        },
        {
            label: "Total Kelas",
            value: classes.length,
            icon: <School className="w-5 h-5" />,
            bgColor: "bg-violet-500/10",
            textColor: "text-violet-400",
        },
        {
            label: "Mata Pelajaran",
            value: subjects.length,
            icon: <BookOpen className="w-5 h-5" />,
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
        },
    ];

    const attendanceStats = [
        { label: "Hadir", count: statusCount("HADIR"), color: "text-emerald-400 bg-emerald-500/10" },
        { label: "Izin", count: statusCount("IZIN"), color: "text-amber-400 bg-amber-500/10" },
        { label: "Sakit", count: statusCount("SAKIT"), color: "text-blue-400 bg-blue-500/10" },
        { label: "Alpha", count: statusCount("ALPHA"), color: "text-red-400 bg-red-500/10" },
        { label: "Terlambat", count: statusCount("TERLAMBAT"), color: "text-orange-400 bg-orange-500/10" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
                <p className="text-slate-400 mt-1">
                    SMA Negeri 1 Contoh •{" "}
                    {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <span className={stat.textColor}>{stat.icon}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Attendance Today */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-blue-400" />
                        Ringkasan Presensi Hari Ini
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {attendanceStats.map((stat) => (
                            <div key={stat.label} className={`p-4 rounded-xl text-center ${stat.color}`}>
                                <p className="text-2xl font-bold">{stat.count}</p>
                                <p className="text-xs mt-1 opacity-80">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                    {todayRecords.length === 0 && (
                        <p className="text-sm text-slate-500 text-center mt-4">
                            Belum ada presensi hari ini. Guru belum menginput data.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
