"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, type AttendanceStatus } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import {
    Save,
    Loader2,
    CheckCircle,
    UserCheck,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; color: string }[] = [
    { value: "HADIR", label: "Hadir", emoji: "✅", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30" },
    { value: "IZIN", label: "Izin", emoji: "📋", color: "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30" },
    { value: "SAKIT", label: "Sakit", emoji: "🤒", color: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" },
    { value: "ALPHA", label: "Alpha", emoji: "❌", color: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" },
    { value: "TERLAMBAT", label: "Terlambat", emoji: "⏰", color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" },
];

interface StudentAttendance {
    studentId: string;
    name: string;
    nis: string;
    status: AttendanceStatus;
}

export default function GuruPresensiPage() {
    const searchParams = useSearchParams();
    const currentUser = useAppStore((s) => s.currentUser);
    const getClassesByTeacher = useAppStore((s) => s.getClassesByTeacher);
    const getSchedulesByTeacher = useAppStore((s) => s.getSchedulesByTeacher);
    const getStudentsByClass = useAppStore((s) => s.getStudentsByClass);
    const saveAttendance = useAppStore((s) => s.saveAttendance);

    const [selectedClassId, setSelectedClassId] = useState(searchParams.get("classId") || "");
    const [selectedScheduleId, setSelectedScheduleId] = useState(searchParams.get("scheduleId") || "");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [studentData, setStudentData] = useState<StudentAttendance[]>([]);
    const [saving, setSaving] = useState(false);

    const classes = currentUser ? getClassesByTeacher(currentUser.id) : [];
    const allSchedules = currentUser ? getSchedulesByTeacher(currentUser.id) : [];
    const filteredSchedules = allSchedules.filter((s) => s.classId === selectedClassId);

    // Load students when class changes
    useEffect(() => {
        if (selectedClassId) {
            const students = getStudentsByClass(selectedClassId);
            setStudentData(
                students.map((s) => ({
                    studentId: s.id,
                    name: s.name,
                    nis: s.nis,
                    status: "HADIR" as AttendanceStatus,
                }))
            );
        } else {
            setStudentData([]);
        }
    }, [selectedClassId, getStudentsByClass]);

    function setAllHadir() {
        setStudentData((prev) => prev.map((s) => ({ ...s, status: "HADIR" })));
        toast.success("Semua siswa diset Hadir");
    }

    function setStudentStatus(studentId: string, status: AttendanceStatus) {
        setStudentData((prev) =>
            prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
        );
    }

    async function handleSave() {
        if (!selectedScheduleId || !date || studentData.length === 0) {
            toast.error("Pilih kelas, jadwal, dan tanggal terlebih dahulu");
            return;
        }

        setSaving(true);
        await new Promise((r) => setTimeout(r, 500));

        const schedule = allSchedules.find((s) => s.id === selectedScheduleId);

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

        const nonHadir = studentData.filter((s) => s.status !== "HADIR");
        setSaving(false);
        toast.success(
            `Presensi tersimpan! ${nonHadir.length > 0 ? `${nonHadir.length} notifikasi WA terkirim.` : ""}`
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Input Presensi</h1>
                <p className="text-slate-400 mt-1">Pilih kelas dan jadwal, lalu tentukan status kehadiran siswa</p>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Kelas</Label>
                            <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedScheduleId(""); }}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Mata Pelajaran</Label>
                            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId} disabled={!selectedClassId}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Pilih mapel" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {filteredSchedules.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.subjectName} ({s.startTime}-{s.endTime})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Tanggal</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student List */}
            {studentData.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white text-base">
                            Daftar Siswa ({studentData.length})
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setAllHadir}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                            <UserCheck className="w-4 h-4 mr-1.5" />
                            Semua Hadir
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {studentData.map((student, idx) => (
                            <div
                                key={student.studentId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-white">{student.name}</p>
                                        <p className="text-xs text-slate-500">NIS: {student.nis}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setStudentStatus(student.studentId, opt.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${student.status === opt.value
                                                    ? opt.color + " ring-1 ring-current shadow-lg"
                                                    : "bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            {opt.emoji} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Save Button */}
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={saving || !selectedScheduleId}
                                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg px-8 h-11"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan Presensi
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedClassId && studentData.length === 0 && (
                <p className="text-center text-slate-500 py-12">
                    Tidak ada siswa di kelas ini
                </p>
            )}
        </div>
    );
}
