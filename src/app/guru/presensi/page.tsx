"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, type AttendanceStatus, type Student } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Save,
    Loader2,
    CheckCircle,
    UserCheck,
    Users,
    AlertTriangle,
    Mail,
    Info,
    Megaphone,
    Clock,
    Calendar,
    Search,
    User
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; activeClass: string; short: string }[] = [
    { value: "HADIR", label: "Hadir", emoji: "✅", activeClass: "bg-[#10B981] text-white border-[#10B981] shadow-md shadow-emerald-500/20", short: "H" },
    { value: "IZIN", label: "Izin", emoji: "📋", activeClass: "bg-[#F59E0B] text-white border-[#F59E0B] shadow-md shadow-amber-500/20", short: "I" },
    { value: "SAKIT", label: "Sakit", emoji: "🤒", activeClass: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20", short: "S" },
    { value: "ALPHA", label: "Alpha", emoji: "❌", activeClass: "bg-[#EF4444] text-white border-[#EF4444] shadow-md shadow-red-500/20", short: "A" },
    { value: "TERLAMBAT", label: "Telat", emoji: "⏰", activeClass: "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20", short: "T" },
    { value: "KEPERLUAN_SEKOLAH", label: "Tugas", emoji: "🏫", activeClass: "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20", short: "KS" },
];

interface StudentAttendance {
    studentId: string;
    name: string;
    nis: string;
    status: AttendanceStatus;
    photoUrl?: string; // Mock photo
    hasPermission?: boolean;
    permissionReason?: string;
    permissionPhoto?: string;
}

export default function GuruPresensiPage() {
    const searchParams = useSearchParams();
    const currentUser = useAppStore((s) => s.currentUser);
    const getClassesByTeacher = useAppStore((s) => s.getClassesByTeacher);
    const getSchedulesByTeacher = useAppStore((s) => s.getSchedulesByTeacher);
    const getStudentsByClass = useAppStore((s) => s.getStudentsByClass);
    const saveAttendance = useAppStore((s) => s.saveAttendance);
    const saveClassSession = useAppStore((s) => s.saveClassSession);
    const leaveRequests = useAppStore((s) => s.leaveRequests);

    const [selectedClassId, setSelectedClassId] = useState(searchParams.get("classId") || "");
    const [selectedScheduleId, setSelectedScheduleId] = useState(searchParams.get("scheduleId") || "");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [studentData, setStudentData] = useState<StudentAttendance[]>([]);
    const [saving, setSaving] = useState(false);

    // Journal State
    const [topic, setTopic] = useState("");
    const [notes, setNotes] = useState("");

    const classes = currentUser ? getClassesByTeacher(currentUser.id) : [];
    const allSchedules = currentUser ? getSchedulesByTeacher(currentUser.id) : [];
    const filteredSchedules = allSchedules.filter((s) => s.classId === selectedClassId);

    // Load students when class changes
    useEffect(() => {
        if (selectedClassId) {
            const students = getStudentsByClass(selectedClassId);
            const permissionMap = new Map();

            // Check for pending/approved permissions for this date
            leaveRequests.forEach(lr => {
                if (date >= lr.startDate && date <= lr.endDate && (lr.status === "APPROVED" || lr.status === "PENDING")) {
                    permissionMap.set(lr.studentId, lr);
                }
            });

            setStudentData(
                students.map((s) => ({
                    studentId: s.id,
                    name: s.name,
                    nis: s.nis,
                    // photoUrl: s.photoUrl, // Not in type yet, assume store returns it or default
                    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
                    status: "HADIR" as AttendanceStatus,
                    hasPermission: permissionMap.has(s.id),
                    permissionReason: permissionMap.get(s.id)?.reason,
                    permissionPhoto: permissionMap.get(s.id)?.selfieUrl,
                }))
            );
        } else {
            setStudentData([]);
        }
    }, [selectedClassId, getStudentsByClass, leaveRequests, date]);

    function setAllHadir() {
        setStudentData((prev) => prev.map((s) => ({ ...s, status: "HADIR" })));
        toast.success("Semua siswa diset Hadir");
    }

    function setStudentStatus(studentId: string, status: AttendanceStatus) {
        setStudentData((prev) =>
            prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
        );
    }

    function handlePanicButton() {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Menghubungi Tim BK & Keamanan...',
            success: 'Tim BK telah dikirim notifikasi & lokasi kelas Anda!',
            error: 'Gagal menghubungi',
        });
    }

    async function handleSave() {
        if (!selectedScheduleId || !date || studentData.length === 0) {
            toast.error("Pilih kelas, jadwal, dan tanggal terlebih dahulu");
            return;
        }

        if (!topic) {
            toast.warning("Mohon isi materi pembelajaran hari ini");
            return;
        }

        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));

        const schedule = allSchedules.find((s) => s.id === selectedScheduleId);

        // Save Attendance
        saveAttendance(
            studentData.map((s) => ({
                studentId: s.studentId,
                studentName: s.name,
                scheduleId: selectedScheduleId,
                subjectName: schedule?.subjectName || "",
                className: schedule?.className || "",
                date,
                status: s.status,
            }))
        );

        // Save Journal
        saveClassSession({
            scheduleId: selectedScheduleId,
            date,
            topic,
            notes
        });

        const nonHadir = studentData.filter((s) => s.status !== "HADIR");
        setSaving(false);
        toast.success(
            `Presensi & Jurnal tersimpan! ${nonHadir.length > 0 ? `${nonHadir.length} notifikasi WA terkirim.` : ""}`
        );
    }

    // Stats for Mini Dashboard
    const presentCount = studentData.filter(s => s.status === "HADIR").length;
    const totalStudents = studentData.length;
    const presencePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    // Mock frequent late (would come from store in real app)
    const frequentLate = studentData.slice(0, 3);

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header & Panic Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <CheckCircle className="w-8 h-8 text-[#000080]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Input Presensi</h1>
                        <p className="text-slate-500 font-medium">Catat kehadiran & jurnal kelas.</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handlePanicButton}
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm font-bold animate-pulse"
                >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Panggil Guru BK
                </Button>
            </div>

            {/* Mini Dashboard (Only visible when students loaded) */}
            {studentData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Presence Percentage */}
                    <Card className="bg-gradient-to-br from-[#000080] to-blue-800 text-white border-none shadow-lg rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <p className="text-blue-100 font-medium text-sm uppercase tracking-wider">Kehadiran Hari Ini</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-4xl font-black tracking-tight">{presencePercentage}%</span>
                                    <span className="text-sm opacity-80">Hadir</span>
                                </div>
                            </div>
                            <div className="w-full bg-blue-900/50 h-2 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${presencePercentage}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Frequent Late Warning */}
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl md:col-span-2">
                        <CardHeader className="py-4 px-6 border-b border-slate-50 bg-slate-50/30">
                            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Perhatian: Sering Terlambat (Bulan Ini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-4">
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {frequentLate.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl min-w-[200px]">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{s.name}</p>
                                            <p className="text-[10px] text-red-500 font-bold">3x Terlambat</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Filters Sidebar (Mobile: Top, Desktop: Left Sticky) */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <div className="h-2 bg-[#000080] w-full" />
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Pilih Kelas</Label>
                                <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedScheduleId(""); }}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800 h-12 rounded-xl focus:ring-[#000080]/10">
                                        <SelectValue placeholder="-- Kelas --" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id} className="focus:bg-blue-50 focus:text-[#000080] font-medium">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Mata Pelajaran</Label>
                                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId} disabled={!selectedClassId}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800 h-12 rounded-xl focus:ring-[#000080]/10">
                                        <SelectValue placeholder="-- Mapel --" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                                        {filteredSchedules.map((s) => (
                                            <SelectItem key={s.id} value={s.id} className="focus:bg-blue-50 focus:text-[#000080] font-medium">
                                                {s.subjectName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Tanggal</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-slate-50 border-slate-200 text-slate-800 h-12 rounded-xl focus:ring-[#000080]/10"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Legend */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-[#000080]" /> Keterangan Status
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="text-base">{opt.emoji}</span> {opt.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Student Grid & Journal */}
                <div className="lg:col-span-3 space-y-8">
                    {studentData.length > 0 && (
                        <>
                            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Daftar Siswa ({studentData.length})
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Cari siswa..."
                                            className="h-9 w-40 text-xs bg-white border-slate-200 rounded-lg"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={setAllHadir}
                                            className="bg-white border-emerald-200 text-[#10B981] hover:bg-emerald-50 hover:border-[#10B981] font-bold rounded-lg text-xs h-9"
                                        >
                                            <UserCheck className="w-3 h-3 mr-2" />
                                            Set Semua Hadir
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-3">
                                        {studentData.map((student, idx) => (
                                            <div
                                                key={student.studentId}
                                                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white border transition-all shadow-sm hover:shadow-md ${student.status === 'HADIR' ? 'border-slate-100' : 'border-slate-300 bg-slate-50'}`}
                                            >
                                                {/* Student Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                                                            <img
                                                                src={student.photoUrl}
                                                                alt={student.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.name}&background=random`;
                                                                }}
                                                            />
                                                        </div>
                                                        {student.hasPermission && (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <button className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform animate-pulse">
                                                                        <Mail className="w-3 h-3" />
                                                                    </button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Detail Izin Orang Tua</DialogTitle>
                                                                        <DialogDescription>
                                                                            Pengajuan izin untuk <b>{student.name}</b>.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4">
                                                                        <div className="p-4 bg-amber-50 rounded-xl text-amber-900 text-sm">
                                                                            " {student.permissionReason} "
                                                                        </div>
                                                                        {student.permissionPhoto && (
                                                                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                                                                <img src={student.permissionPhoto} alt="Bukti" className="w-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button
                                                                                onClick={() => setStudentStatus(student.studentId, "HADIR")}
                                                                                variant="outline"
                                                                            >
                                                                                Tolak (Tetap Hadir)
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => setStudentStatus(student.studentId, "IZIN")}
                                                                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                                                            >
                                                                                Terima Izin
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 tracking-wider flex items-center gap-2">
                                                            {student.nis}
                                                            {student.status !== 'HADIR' && (
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                                                    {STATUS_OPTIONS.find(o => o.value === student.status)?.label}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Toggles */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => setStudentStatus(student.studentId, opt.value)}
                                                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95 ${student.status === opt.value
                                                                ? opt.activeClass
                                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                                                                }`}
                                                            title={opt.label}
                                                        >
                                                            {opt.short}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Class Journal */}
                            <Card className="border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden">
                                <CardHeader className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Jurnal Kelas
                                    </CardTitle>
                                    <CardDescription>Catat materi dan kejadian penting hari ini.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Materi Pembelajaran <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Contoh: Bab 3 - Persamaan Kuadrat"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="bg-slate-50 border-slate-200 h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Catatan Kejadian (Opsional)</Label>
                                        <Textarea
                                            placeholder="Contoh: Siswa A tertidur, proyektor rusak, dll."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="bg-slate-50 border-slate-200 min-h-[100px]"
                                        />
                                    </div>
                                </CardContent>
                                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || !selectedScheduleId}
                                        className="bg-[#000080] hover:bg-[#000060] text-white shadow-xl shadow-blue-900/20 px-8 h-12 rounded-xl font-bold text-base transition-all transform active:scale-[0.98]"
                                        size="lg"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                SIMPAN & KUNCI PRESENSI
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </>
                    )}

                    {selectedClassId && studentData.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-inner">
                            <Users className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-xl font-bold text-slate-400">Tidak ada siswa terdaftar di kelas ini</p>
                        </div>
                    )}

                    {!selectedClassId && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-inner border-dashed">
                            <Search className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-xl font-bold text-slate-400">Pilih Kelas di Samping</p>
                            <p className="text-slate-400 text-sm mt-2">Silakan pilih kelas, mapel, dan tanggal untuk memulai.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon for Journal
function BookOpen(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
}

