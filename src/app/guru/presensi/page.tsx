"use client";

import { saveAttendanceAPI } from "@/hooks/useAttendanceData";
import { saveJurnalAPI } from "@/hooks/useJurnalData";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, type AttendanceStatus } from "@/lib/store";
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
    Clock,
    Calendar,
    RefreshCw,
    Search,
    User,
    BookOpen,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useJadwalData } from "@/hooks/useJadwalData";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useIzinData } from "@/hooks/useIzinData";
import { getApiBaseUrl } from "@/lib/api-config";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; activeClass: string; short: string }[] = [
    { value: "HADIR", label: "Hadir", emoji: "✅", activeClass: "bg-[#10B981] text-white border-[#10B981] shadow-md shadow-emerald-500/20", short: "H" },
    { value: "IZIN", label: "Izin", emoji: "📋", activeClass: "bg-[#F59E0B] text-white border-[#F59E0B] shadow-md shadow-amber-500/20", short: "I" },
    { value: "SAKIT", label: "Sakit", emoji: "🤒", activeClass: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20", short: "S" },
    { value: "ALPHA", label: "Alpha", emoji: "❌", activeClass: "bg-[#EF4444] text-white border-[#EF4444] shadow-md shadow-red-500/20", short: "A" },
    { value: "TERLAMBAT", label: "Telat", emoji: "⏰", activeClass: "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20", short: "T" },
    { value: "KEPERLUAN_SEKOLAH", label: "Tugas", emoji: "🏫", activeClass: "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20", short: "KS" },
];

const formatSubjectName = (name: string) => {
    const ABBREVIATIONS: Record<string, string> = {
        "Pendidikan Jasmani Olahraga dan Kesehatan": "PJOK",
        "Pendidikan Pancasila dan Kewarganegaraan": "PPKn",
        "Pendidikan Pancasila": "PPKn",
        "Ilmu Pengetahuan Alam": "IPA",
        "Ilmu Pengetahuan Sosial": "IPS",
        "Pendidikan Agama Islam dan Budi Pekerti": "PAI & BP",
        "Pendidikan Agama Islam": "PAI",
        "Bahasa Indonesia": "B. Indonesia",
        "Bahasa Inggris": "B. Inggris",
        "Seni Budaya": "Seni Budaya",
        "Prakarya": "Prakarya",
        "Informatika": "Informatika",
        "Bimbingan Konseling": "BK",
        "Pendidikan Kepercayaan terhadap Tuhan YME dan Budi Pekerti": "P. Kepercayaan",
        "Bahasa Daerah": "B. Daerah",
    };
    return ABBREVIATIONS[name] || name;
};

interface StudentAttendance {
    studentId: string;
    name: string;
    nis: string;
    status: AttendanceStatus;
    photoUrl?: string; 
    hasPermission?: boolean;
    permissionReason?: string;
    permissionPhoto?: string;
}

export default function GuruPresensiPage() {
    const searchParams = useSearchParams();
    const currentUser = useAppStore((s) => s.currentUser);
    const saveAttendance = useAppStore((s) => s.saveAttendance);
    const saveClassSession = useAppStore((s) => s.saveClassSession);
 
    const [selectedSubjectName, setSelectedSubjectName] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedScheduleId, setSelectedScheduleId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [studentData, setStudentData] = useState<StudentAttendance[]>([]);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isExistingAttendance, setIsExistingAttendance] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
 
    const [allAttendance, setAllAttendance] = useState<any[]>([]);
    const [frequentLate, setFrequentLate] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
 
    const daysInIndonesian = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = daysInIndonesian[new Date(date).getDay()];
 
    // Fetch REAL data from database
    const { jadwal: rawJadwal, loading: loadingJadwal } = useJadwalData(currentDayName, undefined, currentUser?.teacherCode);
    const { siswa: rawSiswa, loading: loadingSiswaData } = useSiswaData(isConfirmed ? selectedClassId : "", undefined, undefined, false, undefined, true);
    const { izin: allIzin } = useIzinData();
 
    // Fetch History for "Frequent Late" calculation
    useEffect(() => {
        if (isConfirmed && selectedClassId) {
            const fetchHistory = async () => {
                try {
                    const res = await fetch(`${getApiBaseUrl()}/presensi/index.php?class=${selectedClassId}`);
                    const data = await res.json();
                    if (data.status === 'success') {
                        setAllAttendance(data.data);
                        
                        const lateCounts: Record<string, { count: number, name: string, studentId: string }> = {};
                        data.data.filter((a: any) => a.status === 'TERLAMBAT').forEach((a: any) => {
                            if (!lateCounts[a.student_id]) {
                                lateCounts[a.student_id] = { count: 0, name: a.student_name, studentId: a.student_id };
                            }
                            lateCounts[a.student_id].count++;
                        });
                        
                        const sorted = Object.values(lateCounts)
                            .sort((a: any, b: any) => b.count - a.count)
                            .slice(0, 3);
                        setFrequentLate(sorted);
                    }
                } catch (e) {
                    console.error("Failed to fetch history", e);
                }
            };
            fetchHistory();
        }
    }, [isConfirmed, selectedClassId]);

    // Journal State
    const [topic, setTopic] = useState("");
    const [notes, setNotes] = useState("");
  
    // Map data from API
    const schedules = rawJadwal.map(j => ({
        id: j.id.toString(),
        rombelId: j.class_name,
        className: j.class_name,
        subjectName: j.subject_hint || j.teacher_mapel?.split(' (')[0] || "Mata Pelajaran",
    }));
  
    const subjects = Array.from(new Set(schedules.map(s => s.subjectName)))
        .map(name => ({ id: name, name: formatSubjectName(name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
 
    const sortClassNames = (a: string, b: string) => {
        const order: Record<string, number> = { "VII": 7, "VIII": 8, "IX": 9 };
        const gradeA = a.split(" ")[0];
        const gradeB = b.split(" ")[0];
        if (order[gradeA] !== order[gradeB]) {
            return (order[gradeA] || 0) - (order[gradeB] || 0);
        }
        return a.localeCompare(b);
    };
 
    const filteredClasses = Array.from(new Map(schedules
        .filter((s) => s.subjectName === selectedSubjectName)
        .map(s => [s.rombelId, { id: s.rombelId, name: s.className }])
    ).values()).sort((a, b) => sortClassNames(a.name, b.name));
    useEffect(() => {
        if (selectedClassId && selectedSubjectName) {
            const sch = schedules.find(s => s.className === selectedClassId && s.subjectName === selectedSubjectName);
            if (sch) setSelectedScheduleId(sch.id);
        } else {
            setSelectedScheduleId("");
        }
        setIsExistingAttendance(false);
    }, [selectedClassId, selectedSubjectName, rawJadwal]);
  
    useEffect(() => {
        setIsConfirmed(false);
        setIsExistingAttendance(false);
    }, [date]);
  
    useEffect(() => {
        if (rawJadwal.length > 0) {
            const schIdParam = searchParams.get("scheduleId");
            const dateParam = searchParams.get("date");
            const schIds = schIdParam ? schIdParam.split(',') : [];
            const schId = schIds[0];
            const clsId = searchParams.get("rombelId");
            
            if (dateParam) {
                setDate(dateParam);
            }

            if (schId) {
                const found = rawJadwal.find(j => j.id.toString() === schId);
                if (found) {
                    setSelectedSubjectName(found.subject_hint || found.teacher_mapel?.split(' (')[0] || "Mata Pelajaran");
                    setSelectedClassId(found.class_name);
                    setSelectedScheduleId(schId);
                    setIsConfirmed(true);
                }
            } else if (clsId) {
                setSelectedClassId(clsId);
                const firstSch = rawJadwal.find(j => j.class_name === clsId);
                if (firstSch) {
                    setSelectedSubjectName(firstSch.subject_hint || firstSch.teacher_mapel?.split(' (')[0] || "Mata Pelajaran");
                }
            }
        }
    }, [rawJadwal, searchParams]);
 
    useEffect(() => {
        if (rawSiswa.length > 0) {
            const permissionMap = new Map();
            allIzin.forEach((lr: any) => {
                if (date >= lr.start_date && date <= lr.end_date && (lr.status === "APPROVED" || lr.status === "PENDING")) {
                    permissionMap.set(lr.student_id?.toString(), lr);
                }
            });
            setStudentData(
                rawSiswa.map((s) => ({
                    studentId: s.id.toString(),
                    name: s.name,
                    nis: s.nisn || s.noInduk,
                    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
                    status: (permissionMap.get(s.id.toString())?.type === 'SAKIT' ? 'SAKIT' : 
                            permissionMap.has(s.id.toString()) ? 'IZIN' : 'HADIR') as AttendanceStatus,
                    hasPermission: permissionMap.has(s.id.toString()),
                    permissionReason: permissionMap.get(s.id.toString())?.reason,
                    permissionPhoto: permissionMap.get(s.id.toString())?.selfie_url,
                }))
            );
        } else {
            setStudentData([]);
        }
    }, [rawSiswa, allIzin, date]);
 
    // Check for existing attendance when confirmed
    useEffect(() => {
        if (isConfirmed && selectedScheduleId && date && rawSiswa.length > 0) {
            const checkExisting = async () => {
                setLoadingExisting(true);
                try {
                    const attRes = await fetch(`${getApiBaseUrl()}/presensi/index.php?date=${date}&schedule_id=${selectedScheduleId}`);
                    const attData = await attRes.json();
                    
                    const jurRes = await fetch(`${getApiBaseUrl()}/jurnal/index.php?date=${date}&schedule_id=${selectedScheduleId}`);
                    const jurData = await jurRes.json();

                    if (attData.status === 'success' && attData.data.length > 0) {
                        setIsExistingAttendance(true);
                        toast.info("Presensi sudah pernah diisi. Anda masuk ke mode EDIT.");
                        
                        // Populate with existing data
                        const permissionMap = new Map();
                        allIzin.forEach((lr: any) => {
                            if (date >= lr.start_date && date <= lr.end_date && (lr.status === "APPROVED" || lr.status === "PENDING")) {
                                permissionMap.set(lr.student_id?.toString(), lr);
                            }
                        });

                        setStudentData(
                            rawSiswa.map((s) => {
                                const existing = attData.data.find((a: any) => a.student_id.toString() === s.id.toString());
                                return {
                                    studentId: s.id.toString(),
                                    name: s.name,
                                    nis: s.nisn || s.noInduk,
                                    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
                                    status: (existing ? existing.status : (permissionMap.get(s.id.toString())?.type === 'SAKIT' ? 'SAKIT' : 
                                            permissionMap.has(s.id.toString()) ? 'IZIN' : 'HADIR')) as AttendanceStatus,
                                    hasPermission: permissionMap.has(s.id.toString()),
                                    permissionReason: permissionMap.get(s.id.toString())?.reason,
                                    permissionPhoto: permissionMap.get(s.id.toString())?.selfie_url,
                                };
                            })
                        );

                        if (jurData.status === 'success' && jurData.data.length > 0) {
                            setTopic(jurData.data[0].topic || "");
                            setNotes(jurData.data[0].notes || "");
                        }
                    } else {
                        setIsExistingAttendance(false);
                    }
                } catch (e) {
                    console.error("Failed to check existing attendance", e);
                } finally {
                    setLoadingExisting(false);
                }
            };
            checkExisting();
        }
    }, [isConfirmed, selectedScheduleId, date, rawSiswa, allIzin]);
 
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
        if (!topic) {
            toast.warning("Mohon isi materi pembelajaran hari ini");
            return;
        }
        setSaving(true);
        const schIdParam = searchParams.get("scheduleId");
        const allSchIds = schIdParam ? schIdParam.split(',') : [selectedScheduleId];
        
        const schedule = schedules.find((s: any) => s.id === selectedScheduleId);
        
        let allAttendanceRecords: any[] = [];
        allSchIds.forEach(id => {
            const records = studentData.map((s) => ({
                studentId: s.studentId,
                scheduleId: id,
                teacherCode: currentUser?.teacherCode || "GUEST",
                className: schedule?.className || "",
                subjectName: schedule?.subjectName || "",
                date,
                status: s.status,
            }));
            allAttendanceRecords = [...allAttendanceRecords, ...records];
        });

        const attRes = await saveAttendanceAPI(allAttendanceRecords);
        
        let jurSuccess = true;
        for (const id of allSchIds) {
            const jurRes = await saveJurnalAPI({
                scheduleId: id,
                teacherCode: currentUser?.teacherCode || "GUEST",
                date,
                topic,
                notes
            });
            if (jurRes.status !== "success") jurSuccess = false;
        }

        if (attRes.status === "success" && jurSuccess) {
            saveAttendance(allAttendanceRecords.map(r => ({ ...r, studentName: "" })));
            saveClassSession({ scheduleId: selectedScheduleId, date, topic, notes });
            setIsSuccessOpen(true);
        } else {
            toast.error("Gagal menyimpan ke database");
        }
        setSaving(false);
    }
 
    const FilterCardUI = (
        <Card className="border-slate-200 bg-white shadow-2xl rounded-3xl overflow-hidden border-t-8 border-t-[#000080]">
            <CardContent className={!isConfirmed ? "p-8 space-y-8" : "p-6 space-y-6"}>
                <div className="space-y-3">
                    <Label className="text-slate-700 font-black uppercase text-xs tracking-[0.2em]">Mata Pelajaran</Label>
                    <Select value={selectedSubjectName} onValueChange={(v) => { 
                        setSelectedSubjectName(v); 
                        setSelectedClassId(""); 
                        setIsConfirmed(false);
                    }} disabled={loadingJadwal}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800 h-14 rounded-2xl focus:ring-[#000080]/10 font-bold shadow-sm">
                            <SelectValue placeholder={loadingJadwal ? "Memuat..." : "-- Pilih Mapel --"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                            {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="focus:bg-blue-50 focus:text-[#000080] font-bold py-3">{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <Label className="text-slate-700 font-black text-xs uppercase tracking-widest">Pilih Kelas</Label>
                    {!selectedSubjectName ? (
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <Search className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-300">Pilih Mapel Dahulu</p>
                        </div>
                    ) : (
                        <div className="max-h-[220px] overflow-y-auto pr-2 space-y-4">
                            {["VII", "VIII", "IX"].map((grade) => {
                                const classesInGrade = filteredClasses.filter(c => c.name.split(" ")[0] === grade);
                                if (classesInGrade.length === 0) return null;
                                return (
                                    <div key={grade} className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">{grade}</p>
                                        <div className={!isConfirmed ? "grid grid-cols-2 sm:grid-cols-4 gap-2" : "space-y-1"}>
                                            {classesInGrade.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedClassId(c.id);
                                                        setIsConfirmed(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${selectedClassId === c.id ? "bg-blue-50 text-[#000080] shadow-sm border border-blue-100" : "text-slate-500 hover:bg-slate-50 border border-transparent"}`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Tanggal</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50 border-slate-200 h-14 rounded-xl font-bold" />
                </div>
                <Button 
                    onClick={() => setIsConfirmed(true)}
                    disabled={!selectedClassId || !selectedSubjectName || isConfirmed}
                    className={`w-full h-14 rounded-xl font-black text-base shadow-xl ${isConfirmed ? "bg-emerald-500 text-white" : "bg-[#000080] text-white"}`}
                >
                    {isConfirmed ? ( <><CheckCircle className="w-5 h-5 mr-2" /> TERKONFIRMASI</> ) : ( "Tampilkan Daftar Siswa" )}
                </Button>
            </CardContent>
        </Card>
    );

    const presentCount = studentData.filter(s => s.status === "HADIR").length;
    const totalStudents = studentData.length;
    const presencePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return (
        <div className="space-y-8 font-sans pb-20">
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
            </div>

            {!isConfirmed ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-full max-w-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-[#000080] mb-3">Siap Melakukan Presensi?</h2>
                            <p className="text-slate-500 font-medium">Pilih mata pelajaran dan kelas Anda untuk memulai pencatatan.</p>
                        </div>
                        {FilterCardUI}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock className="w-5 h-5" /></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Waktu</p><p className="text-xs font-bold text-slate-700">Tersinkron</p></div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Calendar className="w-5 h-5" /></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Hari Ini</p><p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><User className="w-5 h-5" /></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Status</p><p className="text-xs font-bold text-slate-700">Aktif</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-700">
                    {/* Header with Kembali Button */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsConfirmed(false)}
                            className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                        >
                            <Search className="w-4 h-4 mr-2 rotate-90" /> Ubah Filter / Kembali
                        </Button>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-[#000080] border-blue-100 font-bold">
                                {selectedSubjectName}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                Kelas {selectedClassId}
                            </Badge>
                            {searchParams.get("scheduleId")?.includes(',') && (
                                <Badge className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">
                                    {searchParams.get("scheduleId")?.split(',').length} JAM PELAJARAN
                                </Badge>
                            )}
                            {isExistingAttendance && (
                                <Badge className="px-3 py-1 bg-amber-100 text-amber-700 border-amber-200 font-bold animate-pulse">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> MODE EDIT (SUDAH TERISI)
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-[#000080] to-blue-800 text-white shadow-lg rounded-2xl">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-blue-100 font-medium text-sm">Kehadiran Hari Ini</p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-4xl font-black">{presencePercentage}%</span>
                                        <span className="text-sm opacity-80">Hadir</span>
                                    </div>
                                </div>
                                <div className="w-full bg-blue-900/50 h-2 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${presencePercentage}%` }}></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl md:col-span-2">
                            <CardHeader className="py-4 px-6 border-b border-slate-50">
                                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Perhatian: Sering Terlambat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex gap-4 overflow-x-auto scrollbar-hide">
                                {frequentLate.length > 0 ? (
                                    frequentLate.map((l, i) => (
                                        <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-red-50 border border-red-100 p-3 rounded-xl min-w-[180px]">
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-xs">
                                                {l.count}x
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 leading-tight">{l.name}</p>
                                                <p className="text-[10px] font-bold text-red-600 uppercase">Terlambat</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full text-center py-2">
                                        <p className="text-[10px] font-bold text-slate-400 italic">Belum ada catatan keterlambatan di kelas ini.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Users className="w-6 h-6 text-[#000080]" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Daftar Siswa</h3>
                                <Badge className="bg-slate-100 text-slate-500 border-none font-bold ml-1">{studentData.length} Anak</Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                                    <Input 
                                        placeholder="Cari siswa..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-11 pr-4 h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm focus:ring-[#000080]/10 transition-all focus:border-[#000080]/30"
                                    />
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={setAllHadir}
                                    className="w-full sm:w-auto border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold rounded-xl h-12 px-6"
                                >
                                    <UserCheck className="w-4 h-4 mr-2" /> Set Semua Hadir
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loadingSiswaData ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-10 h-10 text-blue-200 animate-spin" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat Data Siswa...</p>
                                </div>
                            ) : loadingExisting ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-10 h-10 text-amber-200 animate-spin" />
                                    <p className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">Memeriksa Data Presensi...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4">
                                        {studentData
                                            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery))
                                            .map((student, idx) => (
                                                <div 
                                                    key={student.studentId} 
                                                    className={`
                                                        group flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 rounded-[2rem] border transition-all duration-300 
                                                        hover:shadow-xl hover:border-blue-200 hover:-translate-y-0.5
                                                        ${student.status === 'HADIR' ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/50 shadow-inner'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-5 mb-4 lg:mb-0">
                                                        <div className="relative">
                                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                {idx + 1}
                                                            </div>
                                                            {student.hasPermission && (
                                                                <div className="absolute -top-1 -left-1 bg-amber-500 text-white rounded-full p-1.5 shadow-md border-2 border-white animate-bounce-subtle">
                                                                    <Mail className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 ml-2">
                                                            <p className="font-black text-slate-800 text-lg lg:text-xl leading-tight truncate group-hover:text-[#000080] transition-colors">{student.name}</p>
                                                            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-1 flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">NIS: {student.nis}</span>
                                                                {student.hasPermission && (
                                                                    <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] px-2">PERIZINAN AKTIF</Badge>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 sm:flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 bg-slate-50/80 p-2 lg:p-2.5 rounded-3xl border border-slate-100 sm:w-fit group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        {STATUS_OPTIONS.map((opt) => (
                                                            <button 
                                                                key={opt.value} 
                                                                onClick={() => setStudentStatus(student.studentId, opt.value)} 
                                                                className={`
                                                                    h-11 lg:h-12 px-3 lg:px-6 flex items-center justify-center rounded-2xl text-xs font-black border transition-all active:scale-90
                                                                    ${student.status === opt.value 
                                                                        ? `${opt.activeClass} z-10 scale-[1.03] shadow-lg` 
                                                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600 hover:shadow-sm"
                                                                    }
                                                                `}
                                                                title={opt.label}
                                                            >
                                                                <span className="hidden sm:inline lg:hidden xl:inline">{opt.label}</span>
                                                                <span className="sm:hidden lg:inline xl:hidden">{opt.short}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    <Card className="border-slate-200 bg-white shadow-2xl rounded-3xl overflow-hidden mb-10">
                                        <CardHeader className="bg-slate-50/80 px-8 py-6 border-b border-slate-100">
                                            <CardTitle className="text-[#000080] text-xl font-black flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-xl text-[#000080]">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                Jurnal Kelas
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 font-bold">Catat ringkasan materi dan kejadian hari ini.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="space-y-3">
                                                <Label className="font-black text-slate-700 uppercase p-1 tracking-[0.1em] text-xs">Materi Pembelajaran *</Label>
                                                <Input 
                                                    value={topic} 
                                                    onChange={(e) => setTopic(e.target.value)} 
                                                    placeholder="Contoh: Bab 4 - Teorema Pythagoras" 
                                                    className="bg-slate-50 border-slate-200 h-14 rounded-2xl font-bold text-slate-800 focus:ring-blue-100" 
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="font-black text-slate-700 uppercase p-1 tracking-[0.1em] text-xs">Catatan & Kejadian</Label>
                                                <Textarea 
                                                    value={notes} 
                                                    onChange={(e) => setNotes(e.target.value)} 
                                                    placeholder="Catatan tambahan..." 
                                                    className="bg-slate-50 border-slate-200 min-h-[140px] rounded-2xl font-bold text-slate-800 focus:ring-blue-100 p-4" 
                                                />
                                            </div>
                                        </CardContent>
                                        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                                            <Button 
                                                variant="ghost"
                                                onClick={() => setIsConfirmed(false)}
                                                className="text-slate-500 font-bold h-14 px-8 rounded-2xl hover:bg-slate-200"
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Batal & Kembali
                                            </Button>
                                            <Button 
                                                onClick={handleSave} 
                                                disabled={saving || loadingExisting} 
                                                className={`${isExistingAttendance ? "bg-amber-600 hover:bg-amber-700" : "bg-[#000080] hover:bg-blue-900"} text-white px-12 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all`}
                                            >
                                                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
                                                {isExistingAttendance ? "SIMPAN PERUBAHAN" : "SIMPAN & KUNCI PRESENSI"}
                                            </Button>
                                        </div>
                                    </Card>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Success Dialog */}
            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] p-10 border-none shadow-2xl flex flex-col items-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
                        <CheckCircle className="w-14 h-14 text-emerald-500" />
                    </div>
                    <DialogHeader className="flex flex-col items-center">
                        <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight text-center">Presensi Berhasil!</DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold leading-relaxed px-4 text-center pt-2">
                            Terima kasih, Bapak/Ibu Guru. Data kehadiran & jurnal hari ini telah tersimpan aman.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="w-full grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#10B981]/5 p-4 rounded-2xl border border-[#10B981]/10 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-1">HADIR</span>
                            <span className="text-2xl font-black text-[#10B981]">{presentCount}</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
                             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">TOTAL</span>
                             <span className="text-2xl font-black text-blue-600">{totalStudents}</span>
                        </div>
                    </div>

                    <Button 
                        onClick={() => {
                            setIsSuccessOpen(false);
                            setIsConfirmed(false);
                            setTopic("");
                            setNotes("");
                        }}
                        className="w-full bg-[#000080] hover:bg-blue-900 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-95 group"
                    >
                        Selesai & Tutup
                        <RefreshCw className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
