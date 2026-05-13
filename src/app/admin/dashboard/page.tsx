"use client";

import { useState } from "react";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Users,
    GraduationCap,
    BookOpen,
    School,
    ClipboardCheck,
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    ChevronRight,
    MapPin,
    ArrowRight,
    Filter,
    Book,
    Coffee,
    Sun,
    Search,
    MessageCircle,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useGuruData } from "@/hooks/useGuruData";
import { useKelasData } from "@/hooks/useKelasData";
import { useRuanganData } from "@/hooks/useRuanganData";
import { useMapelData } from "@/hooks/useMapelData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData } from "@/hooks/useIzinData";
import { useJadwalData } from "@/hooks/useJadwalData";

const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export default function AdminDashboardPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempSelected, setTempSelected] = useState<string[]>([]);
    const [filterGradeTab, setFilterGradeTab] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [teacherSearch, setTeacherSearch] = useState("");
    const today = new Date().toISOString().split("T")[0];
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
    const startDate = fiveDaysAgo.toISOString().split("T")[0];

    const { siswa, loading: loadingSiswa, error: errorSiswa } = useSiswaData();
    const { guru, loading: loadingGuru } = useGuruData();
    const { kelas, loading: loadingKelas, error: errorKelas } = useKelasData();
    const { ruangan } = useRuanganData();
    const { mapel } = useMapelData();
    const { attendance: todayRecords, loading: loadingAtt } = useAttendanceData(today);
    const { attendance: historyRecords } = useAttendanceData(undefined, undefined, undefined, startDate, today);
    const { izin: allIzin, loading: loadingIzin } = useIzinData();
    const { jadwal: allSchedules, loading: loadingJadwal } = useJadwalData();

    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);

    if (!currentUser) return null;
    const isKepalaSekolah = currentUser.teacherCode === "1";

    const teacherCount = guru.length;
    const studentCount = siswa.length;
    const classCount = kelas.length;
    const roomCount = ruangan.length;
    const subjectCount = mapel.length;

    // Attendance summary
    const statusCount = (status: string) => todayRecords.filter((a: any) => a.status?.toUpperCase() === status).length;

    // Pending Permissions
    const pendingPermissions = allIzin.filter((req: any) => req.status === "PENDING");

    // Classes without attendance 
    const todayDayName = DAY_NAMES[new Date().getDay()]; 
    const todaySchedules = allSchedules.filter((s: any) => s.day.toUpperCase() === todayDayName);

    // Group attendance by scheduleId
    const attendanceBySchedule = new Set(todayRecords.map((r: any) => r.schedule_id?.toString()));

    // Schedules that missed attendance
    const missedAttendanceClasses = todaySchedules
        .filter((s: any) => {
            const cleanTeacher = s.teacher_code?.trim().toUpperCase();
            const isRealTeaching = cleanTeacher && 
                    cleanTeacher !== 'UPACARA' && 
                    cleanTeacher !== 'DOA DAN SABDA' && 
                    cleanTeacher !== 'IST' &&
                    s.class_name;
            
            const startHour = s.time_range.split(' - ')[0];
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + "." + now.getMinutes().toString().padStart(2, '0');
            
            return isRealTeaching && !attendanceBySchedule.has(s.id.toString()) && startHour <= currentTime;
        })
        .map((s: any) => ({
            id: s.id,
            teacherCode: s.teacher_code,
            teacherName: s.teacher_name || "Guru Pengampu",
            className: s.class_name,
            subjectName: s.subject_hint || s.teacher_mapel?.split(' (')[0] || "Mata Pelajaran",
            startTime: s.time_range.split(' - ')[0]
        }))
        .sort((a: any, b: any) => b.startTime.localeCompare(a.startTime));

    // Group by Classes
    const classSchedulesFull = Array.from(new Set(todaySchedules.filter((s: any) => s.class_name).map((s: any) => s.class_name)))
        .sort((a: string, b: string) => {
            // Priority Roman Numeral sort for IX, VIII, VII
            const levels: any = { 'VII': 1, 'VIII': 2, 'IX': 3 };
            const aLevel = levels[a.split(' ')[0]] || 99;
            const bLevel = levels[b.split(' ')[0]] || 99;
            if (aLevel !== bLevel) return aLevel - bLevel;
            return a.localeCompare(b);
        })
        .map(className => ({
            className,
            lessons: todaySchedules.filter((s: any) => s.class_name === className).sort((a: any, b: any) => a.slot.localeCompare(b.slot))
        }));

    // Group by Teachers
    const teacherSchedulesFull = Array.from(new Set(todaySchedules.filter((s: any) => s.teacher_name).map((s: any) => s.teacher_name)))
        .sort()
        .map(teacherName => {
            const teacherSchedules = todaySchedules.filter((s: any) => s.teacher_name === teacherName);
            const guruInfo = guru.find((g: any) => g.name === teacherName);
            return {
                teacherName,
                homebase: guruInfo?.homebase || "-",
                mapelMaster: guruInfo?.mapel || "-",
                lessons: teacherSchedules.sort((a: any, b: any) => a.slot.localeCompare(b.slot))
            };
        });

    const stats = [
        {
            label: "Total Siswa",
            value: studentCount,
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
            value: classCount,
            icon: <School className="w-5 h-5 text-white" />,
            bgColor: "bg-emerald-600 shadow-emerald-900/10",
        },
        {
            label: "Total Ruangan",
            value: roomCount,
            icon: <School className="w-5 h-5 text-white" />,
            bgColor: "bg-teal-500 shadow-teal-900/10",
        },
        {
            label: "Mata Pelajaran",
            value: subjectCount,
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

    const handleRemind = async (s: any) => {
        try {
            const res = await fetch("http://127.0.0.1/presensipander/api/notifikasi/index.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_code: s.teacherCode,
                    schedule_id: s.id,
                    type: 'REMINDER',
                    message: `ADMIN: Segera lakukan presensi di kelas ${s.className} - ${s.subjectName} (Pukul ${s.startTime})`,
                    date: today
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success(`Berhasil mengingatkan ${s.teacherName}.`);
            }
        } catch (e) {
            toast.error("Gagal mengirim pengingat.");
        }
    };

    if (loadingSiswa || loadingKelas || loadingGuru || loadingAtt || loadingIzin || loadingJadwal) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#000080]" />
                <p className="text-slate-500 font-bold animate-pulse">Memuat Data Dashboard...</p>
            </div>
        );
    }

    if (errorSiswa || errorKelas) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-2">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-slate-800">Gagal Memuat Data</h2>
                <p className="text-slate-500 max-w-md">{errorSiswa || errorKelas}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-[#000080] rounded-xl">Coba Lagi</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
                        {isKepalaSekolah ? "Ringkasan Laporan" : "Dashboard Admin"}
                    </h1>
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
                        {" • "}
                        <Badge className="bg-[#000080]/10 text-[#000080] border-[#000080]/20 hover:bg-[#000080]/20 px-3 py-1 rounded-full font-bold">
                            T.A. {selectedTahunAjaran || "Semua"}
                        </Badge>
                    </p>
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
                {/* Left Column: Attendance & Schedules (2/3 width) */}
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
 
                    <div className="flex flex-col gap-8">
                        {/* Today's Schedules Detail */}
                        {/* Class Schedules */}
                        <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden flex flex-col border-none ring-1 ring-slate-100">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-600/10 rounded-xl">
                                            <School className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-[#000080] text-base font-bold">Jadwal Per Kelas</CardTitle>
                                            <CardDescription className="text-xs font-medium">Monitoring jadwal aktif hari ini.</CardDescription>
                                        </div>
                                    </div>

                                    <DropdownMenu open={isFilterOpen} onOpenChange={(open) => {
                                        if (open) {
                                            setTempSelected(selectedClasses);
                                            setSearchQuery("");
                                        }
                                        setIsFilterOpen(open);
                                    }}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white font-bold text-xs shadow-sm hover:bg-slate-50 rounded-xl">
                                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{selectedClasses.length === 0 ? "Filter Kelas" : `${selectedClasses.length} Terpilih`}</span>
                                                <ChevronRight className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[280px] bg-white border-slate-200 shadow-2xl rounded-2xl p-3 z-[100] flex flex-col gap-3">
                                            {/* Grade Tabs */}
                                            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                                                {[
                                                    { id: 'ALL', label: 'All' },
                                                    { id: 'VII', label: 'Kls VII' },
                                                    { id: 'VIII', label: 'Kls VIII' },
                                                    { id: 'IX', label: 'Kls IX' },
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setFilterGradeTab(t.id)}
                                                        className={`text-[11px] py-1.5 rounded-lg font-bold transition-all ${filterGradeTab === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                                <input
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="Cari Kelas..."
                                                    className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-600 rounded-xl font-medium"
                                                />
                                            </div>

                                            {/* Checkbox List with Tree Lines */}
                                            <div className="border border-slate-100 rounded-xl p-2 bg-slate-50/30">
                                                <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                                                        checked={(() => {
                                                            const filtered = classSchedulesFull.filter((c: any) => filterGradeTab === 'ALL' || c.className.split(" ")[0] === filterGradeTab);
                                                            return filtered.length > 0 && filtered.every((c: any) => tempSelected.includes(c.className));
                                                        })()}
                                                        onChange={(e) => {
                                                            const filtered = classSchedulesFull
                                                                .filter((c: any) => filterGradeTab === 'ALL' || c.className.split(" ")[0] === filterGradeTab)
                                                                .map((c: any) => c.className);
                                                            if (e.target.checked) {
                                                                setTempSelected(Array.from(new Set([...tempSelected, ...filtered])));
                                                            } else {
                                                                setTempSelected(tempSelected.filter(cls => !filtered.includes(cls)));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-xs font-black text-slate-700">(Select All)</span>
                                                </label>

                                                <div className="relative mt-1 ml-1">
                                                    {/* Vertical dotted line */}
                                                    <div className="absolute left-[13px] top-0 bottom-[12px] w-px border-l border-dotted border-slate-300 pointer-events-none"></div>

                                                    <div className="space-y-0.5 mt-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                                        {classSchedulesFull
                                                            .filter((c: any) => (filterGradeTab === 'ALL' || c.className.split(" ")[0] === filterGradeTab) && (searchQuery === "" || c.className.toLowerCase().includes(searchQuery.toLowerCase())))
                                                            .map((c: any) => (
                                                                <label key={c.className} className="relative flex items-center gap-2.5 pl-[25px] pr-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                                                                    {/* Horizontal dotted connector */}
                                                                    <div className="absolute left-[13px] top-1/2 w-2.5 border-t border-dotted border-slate-300 pointer-events-none"></div>

                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer relative z-10"
                                                                        checked={tempSelected.includes(c.className)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setTempSelected([...tempSelected, c.className]);
                                                                            } else {
                                                                                setTempSelected(tempSelected.filter(cls => cls !== c.className));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">
                                                                        Kelas {c.className}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-9 px-4 text-xs font-bold text-slate-500 rounded-xl"
                                                    onClick={() => setIsFilterOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    className="h-9 px-6 text-xs font-black bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                                    onClick={() => {
                                                        setSelectedClasses(tempSelected);
                                                        setIsFilterOpen(false);
                                                    }}
                                                >
                                                    OK
                                                </Button>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto max-h-[550px] custom-scrollbar">
                                {classSchedulesFull.length > 0 ? (
                                    <div className="p-4 space-y-6">
                                        {classSchedulesFull
                                            .filter((group: any) => selectedClasses.length === 0 || selectedClasses.includes(group.className))
                                            .map((group: any, idx: number) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm py-1 z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                                        <span className="text-base font-black text-slate-800">{group.className}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {group.lessons.length} Sesi Terjadwal
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    {group.lessons.map((lesson: any, lIdx: number) => {
                                                        const isSpecial = lesson.subject_hint?.toUpperCase()?.includes("DOA") || 
                                                                        lesson.teacher_code?.toUpperCase()?.includes("DOA");
                                                        const isRest = lesson.teacher_code?.toUpperCase()?.includes("IST") || 
                                                                    lesson.subject_hint?.toUpperCase()?.includes("IST");
                                                        
                                                        return (
                                                            <div key={lIdx} className={`group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                                                                isSpecial ? 'bg-amber-50/50 border-amber-100 hover:border-amber-200' : 
                                                                isRest ? 'bg-slate-50 border-slate-100' : 
                                                                'bg-white border-slate-100 hover:border-indigo-200'
                                                            }`}>
                                                                <div className={`flex flex-col items-center justify-center min-w-[50px] aspect-square rounded-xl border transition-colors ${
                                                                    isSpecial ? 'bg-amber-100 border-amber-200 text-amber-700' :
                                                                    isRest ? 'bg-slate-200 border-slate-300 text-slate-600' :
                                                                    'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                                                }`}>
                                                                    <span className="text-[9px] font-black opacity-60 leading-none">JAM</span>
                                                                    <span className="text-sm font-black mt-0.5">{lesson.slot}</span>
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-slate-800 text-xs leading-tight">
                                                                            {lesson.subject_hint || lesson.teacher_mapel?.split(' (')[0] || "Mata Pelajaran"}
                                                                        </p>
                                                                        {isSpecial && <Sun className="w-3 h-3 text-amber-500 fill-amber-500/20" />}
                                                                        {isRest && <Coffee className="w-3 h-3 text-slate-400" />}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 mt-1">
                                                                        <div className="p-0.5 rounded-full bg-slate-100 border border-slate-200">
                                                                            <Users className="w-2 h-2 text-slate-400" />
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500 font-bold truncate">
                                                                            {lesson.teacher_name || lesson.teacher_code}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="text-right whitespace-nowrap">
                                                                    <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 group-hover:bg-white transition-colors">
                                                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                                        <span className="text-[10px] font-bold text-slate-600 font-mono">
                                                                            {lesson.time_range.split(' - ')[0]}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                                            <Calendar className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-bold">Tidak ada jadwal hari ini.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Teacher's Current Activity & Rooms */}
                        <Card className="bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden flex flex-col border-none ring-1 ring-slate-100">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-600/10 rounded-xl">
                                            <Users className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-[#000080] text-base font-bold">Aktivitas Mengajar</CardTitle>
                                            <CardDescription className="text-xs font-medium">Monitoring kesibukan guru hari ini.</CardDescription>
                                        </div>
                                    </div>
                                    <div className="relative w-full md:w-72">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={teacherSearch}
                                            onChange={(e) => setTeacherSearch(e.target.value)}
                                            placeholder="Cari Nama Guru..."
                                            className="w-full h-9 pl-9 pr-4 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 overflow-y-auto max-h-[700px] custom-scrollbar">
                                {teacherSchedulesFull.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {teacherSchedulesFull
                                            .filter((group: any) => teacherSearch === "" || group.teacherName.toLowerCase().includes(teacherSearch.toLowerCase()))
                                            .map((group: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-300 bg-white group/t-card shadow-sm hover:shadow-md">
                                                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-slate-50">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 border border-indigo-100 shadow-sm transition-transform group-hover/t-card:scale-105">
                                                        {group.teacherName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-black text-slate-800 text-sm md:text-[15px] leading-snug">
                                                            {group.teacherName}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400">
                                                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="truncate">{group.homebase}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-lg w-fit border border-indigo-100/30">
                                                            <Book className="w-3 h-3" />
                                                            <span className="truncate max-w-[150px]">{group.mapelMaster}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {group.lessons.map((lesson: any, lIdx: number) => (
                                                        <div key={lIdx} className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-2xl border border-slate-100/80 group-hover/t-card:bg-white transition-colors">
                                                            <div className="bg-white text-[10px] font-black text-emerald-700 min-w-[28px] h-7 flex items-center justify-center rounded-lg border border-emerald-100 shadow-sm">
                                                                {lesson.slot}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-black text-slate-700 leading-tight truncate">
                                                                    {lesson.class_name}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-tighter">
                                                                    {lesson.subject_hint || lesson.teacher_mapel?.split(' (')[0] || "Mata Pelajaran"}
                                                                </p>
                                                            </div>
                                                            <div className="text-[9px] font-black text-slate-300 font-mono">
                                                                {lesson.time_range.split(' - ')[0]}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                                            <Users className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-sm font-bold">Tidak ada data guru {teacherSearch ? "yang cocok" : ""} hari ini.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Alerts & Widgets (1/3 width) */}
                <div className="space-y-8">
                    {/* Verification Widget */}
                    {!isKepalaSekolah && (
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
                    )}

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
                                                {!isKepalaSekolah && (
                                                    <button onClick={() => handleRemind(s)} className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 px-2 py-0.5 rounded font-bold transition-colors">
                                                        Ingatkan
                                                    </button>
                                                )}
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
