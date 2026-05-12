"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, CheckCircle2, Eye, GraduationCap, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TahunAjaranItem {
    id: number;
    name: string;
    status: string;
    created_at: string;
    active_students: number | string;
    placement_students: number | string;
    graduated_students: number | string;
    class_count: number | string;
    subject_count: number | string;
    schedule_count: number | string;
}

interface KelasItem {
    id: number;
    grade: string;
    name: string;
}

interface SiswaManageItem {
    id: number;
    noInduk: string;
    nisn: string;
    name: string;
    gender: string;
    cls: string;
    status: string;
    academic_status?: string;
    previous_cls?: string | null;
    min_grade_level?: number | null;
    parent?: string;
    wa?: string;
    tglLahir?: string;
    kota?: string;
    alamat?: string;
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
    nik_ortu?: string;
    tahun_ajaran?: string;
}

const API_BASE = getApiBaseUrl();
const SEMESTERS = ["Ganjil", "Genap"];
const GRADE_FILTERS = [
    { value: "7", label: "Tingkat 7" },
    { value: "8", label: "Tingkat 8" },
    { value: "9", label: "Tingkat 9" },
];

function gradeLevel(value?: string | null) {
    const upper = (value || "").toUpperCase().trim();
    if (upper.startsWith("VIII")) return 8;
    if (upper.startsWith("VII")) return 7;
    if (upper.startsWith("IX")) return 9;
    return 0;
}

function nextAcademicStart() {
    const now = new Date();
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function formatValue(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return "-";
    return String(value);
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatValue(value)}</p>
        </div>
    );
}

function classOptionsForGrade(classes: KelasItem[], sourceStudents: SiswaManageItem[], gradeFilter: string) {
    if (gradeFilter === "all") return [];
    const selectedGrade = Number(gradeFilter);
    const classNames = new Set<string>();

    classes.forEach((kelas) => {
        if (gradeLevel(kelas.name) === selectedGrade) classNames.add(kelas.name);
    });
    sourceStudents.forEach((student) => {
        if (gradeLevel(student.cls) === selectedGrade && student.cls) classNames.add(student.cls);
    });

    return Array.from(classNames).sort((a, b) => a.localeCompare(b));
}

function filterStudentsByClass(students: SiswaManageItem[], gradeFilter: string, classFilter: string) {
    return students.filter((student) => {
        const matchesGrade = gradeFilter === "all" || gradeLevel(student.cls) === Number(gradeFilter);
        const matchesClass = classFilter === "all" || student.cls === classFilter;
        return matchesGrade && matchesClass;
    });
}

export default function AdminTahunAjaranPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const setSelectedTahunAjaran = useAppStore((s) => s.setSelectedTahunAjaran);
    const [periods, setPeriods] = useState<TahunAjaranItem[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState(selectedTahunAjaran || "");
    const [classes, setClasses] = useState<KelasItem[]>([]);
    const [students, setStudents] = useState<SiswaManageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingPeriod, setDeletingPeriod] = useState<string | null>(null);
    const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
    const [yearStart, setYearStart] = useState(String(nextAcademicStart()));
    const [semester, setSemester] = useState("Ganjil");
    const [placementDraft, setPlacementDraft] = useState<Record<number, string>>({});
    const [placementGradeFilter, setPlacementGradeFilter] = useState("all");
    const [placementClassFilter, setPlacementClassFilter] = useState("all");
    const [graduatedGradeFilter, setGraduatedGradeFilter] = useState("all");
    const [graduatedClassFilter, setGraduatedClassFilter] = useState("all");
    const [detailStudent, setDetailStudent] = useState<SiswaManageItem | null>(null);

    const academicYear = `${yearStart}/${Number(yearStart) + 1}`;
    const targetName = `${academicYear} ${semester}`;

    const selectedSummary = periods.find((p) => p.name === selectedPeriod);
    const placementStudents = useMemo(
        () => students.filter((s) => s.academic_status === "PERLU_PENEMPATAN"),
        [students]
    );
    const graduatedStudents = useMemo(
        () => students.filter((s) => s.academic_status === "LULUS"),
        [students]
    );

    const periodExists = periods.some((p) => p.name === targetName);

    const sortedClasses = useMemo(
        () => [...classes].sort((a, b) => gradeLevel(a.name) - gradeLevel(b.name) || a.name.localeCompare(b.name)),
        [classes]
    );
    const placementClassOptions = useMemo(
        () => classOptionsForGrade(sortedClasses, placementStudents, placementGradeFilter),
        [sortedClasses, placementStudents, placementGradeFilter]
    );
    const graduatedClassOptions = useMemo(
        () => classOptionsForGrade(sortedClasses, graduatedStudents, graduatedGradeFilter),
        [sortedClasses, graduatedStudents, graduatedGradeFilter]
    );
    const filteredPlacementStudents = useMemo(
        () => filterStudentsByClass(placementStudents, placementGradeFilter, placementClassFilter),
        [placementStudents, placementGradeFilter, placementClassFilter]
    );
    const filteredGraduatedStudents = useMemo(
        () => filterStudentsByClass(graduatedStudents, graduatedGradeFilter, graduatedClassFilter),
        [graduatedStudents, graduatedGradeFilter, graduatedClassFilter]
    );

    useEffect(() => {
        if (placementClassFilter !== "all" && !placementClassOptions.includes(placementClassFilter)) {
            setPlacementClassFilter("all");
        }
    }, [placementClassFilter, placementClassOptions]);

    useEffect(() => {
        if (graduatedClassFilter !== "all" && !graduatedClassOptions.includes(graduatedClassFilter)) {
            setGraduatedClassFilter("all");
        }
    }, [graduatedClassFilter, graduatedClassOptions]);

    const fetchPeriods = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/config/tahun_ajaran.php?manage=1`);
            const json = await res.json();
            if (json.status !== "success") throw new Error(json.message || "Gagal mengambil tahun ajaran");
            setPeriods(json.data);
            if (!selectedPeriod && json.data.length > 0) setSelectedPeriod(json.data[0].name);
            return json.data as TahunAjaranItem[];
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Gagal mengambil tahun ajaran"));
            return [] as TahunAjaranItem[];
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    const fetchPeriodDetail = useCallback(async (period: string) => {
        if (!period) return;
        setLoadingDetail(true);
        try {
            const [kelasRes, siswaRes] = await Promise.all([
                fetch(`${API_BASE}/kelas/index.php?tahun_ajaran=${encodeURIComponent(period)}`),
                fetch(`${API_BASE}/siswa/index.php?tahun_ajaran=${encodeURIComponent(period)}&include_inactive=1`),
            ]);
            const [kelasJson, siswaJson] = await Promise.all([kelasRes.json(), siswaRes.json()]);
            if (kelasJson.status !== "success") throw new Error(kelasJson.message || "Gagal mengambil kelas");
            if (siswaJson.status !== "success") throw new Error(siswaJson.message || "Gagal mengambil siswa");
            setClasses(kelasJson.data);
            setStudents(siswaJson.data);
            const nextDraft: Record<number, string> = {};
            siswaJson.data.forEach((s: SiswaManageItem) => {
                if (s.academic_status === "PERLU_PENEMPATAN") nextDraft[s.id] = s.cls;
            });
            setPlacementDraft(nextDraft);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Gagal mengambil detail tahun ajaran"));
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    useEffect(() => {
        if (selectedPeriod) fetchPeriodDetail(selectedPeriod);
    }, [selectedPeriod, fetchPeriodDetail]);

    const handleCreate = async () => {
        if (!/^\d{4}$/.test(yearStart)) {
            toast.error("Tahun mulai harus 4 digit, contoh 2026");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch(`${API_BASE}/config/tahun_ajaran.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ academic_year: academicYear, semester }),
            });
            const json = await res.json();
            if (json.status !== "success") throw new Error(json.message || "Gagal membuat tahun ajaran");
            toast.success(`${json.data.name} berhasil dibuat`);
            setSelectedPeriod(json.data.name);
            await fetchPeriods();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Gagal membuat tahun ajaran"));
        } finally {
            setCreating(false);
        }
    };

    const handleUseAsActivePeriod = (period: string) => {
        setSelectedTahunAjaran(period);
        localStorage.setItem("selectedTahunAjaran", period);
        toast.success(`Periode aktif diubah ke ${period}`);
    };

    const handleDeletePeriod = async (period: TahunAjaranItem) => {
        const ok = window.confirm(
            `Hapus tahun ajaran ${period.name} untuk kebutuhan dev?\n\nData siswa, kelas, mapel, jadwal, presensi, jurnal, izin, dan notifikasi yang terkait periode ini akan dihapus.`
        );
        if (!ok) return;

        setDeletingPeriod(period.name);
        try {
            const res = await fetch(`${API_BASE}/config/tahun_ajaran.php`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: period.name,
                    dev_confirm: "DELETE_TAHUN_AJARAN_DEV",
                }),
            });
            const json = await res.json();
            if (json.status !== "success") throw new Error(json.message || "Gagal menghapus tahun ajaran");

            toast.success(`${period.name} berhasil dihapus`);
            const remaining = await fetchPeriods();
            const nextSelected = remaining.find((item) => item.name !== period.name)?.name || "";
            if (selectedPeriod === period.name) setSelectedPeriod(nextSelected);
            if (selectedTahunAjaran === period.name) {
                if (nextSelected) {
                    setSelectedTahunAjaran(nextSelected);
                    localStorage.setItem("selectedTahunAjaran", nextSelected);
                } else {
                    localStorage.removeItem("selectedTahunAjaran");
                }
            }
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Gagal menghapus tahun ajaran"));
        } finally {
            setDeletingPeriod(null);
        }
    };

    const handleSavePlacement = async (student: SiswaManageItem) => {
        const nextClass = placementDraft[student.id];
        if (!nextClass) {
            toast.error("Pilih kelas tujuan terlebih dahulu");
            return;
        }

        setSavingStudentId(student.id);
        try {
            const payload = {
                ...student,
                cls: nextClass,
                academic_status: "PERLU_PENEMPATAN",
                tahun_ajaran: selectedPeriod,
            };
            const res = await fetch(`${API_BASE}/siswa/index.php`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan penempatan");
            toast.success(`${student.name} masuk kelas ${nextClass}`);
            await Promise.all([fetchPeriodDetail(selectedPeriod), fetchPeriods()]);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Gagal menyimpan penempatan"));
        } finally {
            setSavingStudentId(null);
        }
    };

    if (currentUser?.role !== "ADMIN_TU") {
        return (
            <Card className="max-w-2xl border-slate-200 bg-white">
                <CardHeader>
                    <CardTitle className="text-[#000080]">Akses Terbatas</CardTitle>
                    <CardDescription>Menu tahun ajaran hanya tersedia untuk Admin Tata Usaha.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#000080]">Tahun Ajaran</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Kelola periode akademik, kenaikan kelas, dan status kelulusan siswa.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchPeriods} disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-[#000080]">
                            <CalendarDays className="h-5 w-5" />
                            Create Tahun Ajaran
                        </CardTitle>
                        <CardDescription>
                            Semester baru menyalin siswa aktif dari periode terakhir; mapel dan jadwal tetap kosong.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tahun Mulai</Label>
                                <Input value={yearStart} onChange={(e) => setYearStart(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Semester</Label>
                                <Select value={semester} onValueChange={setSemester}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEMESTERS.map((item) => (
                                            <SelectItem key={item} value={item}>{item}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Target Periode</p>
                            <p className="mt-1 text-2xl font-black text-[#000080]">{targetName}</p>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                                {periodExists
                                    ? "Periode ini sudah tersedia."
                                    : "Jika tahun sama, siswa disalin dan mapel kosong. Jika tahun baru, kelas VII/VIII naik kelas dan kelas IX periode sumber ditandai lulus."}
                            </p>
                        </div>

                        <Button className="w-full bg-[#000080] font-bold text-white hover:bg-[#000060]" onClick={handleCreate} disabled={creating || periodExists}>
                            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Buat Tahun Ajaran
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#000080]">Daftar Periode</CardTitle>
                        <CardDescription>Pilih periode untuk melihat siswa perlu penempatan dan lulusan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-[#000080]" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Periode</TableHead>
                                            <TableHead className="text-center">Siswa Aktif</TableHead>
                                            <TableHead className="text-center">Penempatan</TableHead>
                                            <TableHead className="text-center">Lulus</TableHead>
                                            <TableHead className="text-center">Mapel</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {periods.map((period) => (
                                            <TableRow key={period.id} className={selectedPeriod === period.name ? "bg-blue-50/60" : ""}>
                                                <TableCell>
                                                    <div className="font-bold text-slate-800">{period.name}</div>
                                                    <div className="text-xs text-slate-400">{period.class_count} kelas, {period.schedule_count} jadwal</div>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">{period.active_students}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{period.placement_students}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="border-slate-200 text-slate-600">{period.graduated_students}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">{period.subject_count}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => setSelectedPeriod(period.name)}>
                                                            Detail
                                                        </Button>
                                                        <Button size="sm" className="bg-[#000080] text-white hover:bg-[#000060]" onClick={() => handleUseAsActivePeriod(period.name)}>
                                                            Aktifkan
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                            onClick={() => handleDeletePeriod(period)}
                                                            disabled={deletingPeriod === period.name}
                                                            title="Delete tahun ajaran untuk dev"
                                                        >
                                                            {deletingPeriod === period.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-[#000080]">
                            <GraduationCap className="h-5 w-5" />
                            Perlu Penempatan Kelas
                        </CardTitle>
                        <CardDescription>
                            {selectedSummary ? `${selectedSummary.name} - ${selectedSummary.placement_students} siswa perlu dikunci ke kelas baru.` : "Pilih periode terlebih dahulu."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tingkat</Label>
                                <Select
                                    value={placementGradeFilter}
                                    onValueChange={(value) => {
                                        setPlacementGradeFilter(value);
                                        setPlacementClassFilter("all");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua tingkat</SelectItem>
                                        {GRADE_FILTERS.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas</Label>
                                <Select
                                    value={placementClassFilter}
                                    onValueChange={setPlacementClassFilter}
                                    disabled={placementGradeFilter === "all" || placementClassOptions.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua kelas</SelectItem>
                                        {placementClassOptions.map((className) => (
                                            <SelectItem key={className} value={className}>{className}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {loadingDetail ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-[#000080]" />
                            </div>
                        ) : placementStudents.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
                                Tidak ada siswa yang perlu penempatan.
                            </div>
                        ) : filteredPlacementStudents.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
                                Tidak ada siswa sesuai filter.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPlacementStudents.map((student) => {
                                    const minGrade = Number(student.min_grade_level || 0);
                                    const allowedClasses = sortedClasses.filter((kelas) => gradeLevel(kelas.name) >= minGrade);
                                    return (
                                        <div key={student.id} className="rounded-lg border border-slate-200 p-4">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-800">{student.name}</p>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        Dari {student.previous_cls || "-"} ke minimal kelas {minGrade || "-"}
                                                    </p>
                                                </div>
                                                <div className="flex min-w-[260px] gap-2">
                                                    <Select
                                                        value={placementDraft[student.id] || student.cls}
                                                        onValueChange={(value) => setPlacementDraft((current) => ({ ...current, [student.id]: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih kelas" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allowedClasses.map((kelas) => (
                                                                <SelectItem key={kelas.id} value={kelas.name}>{kelas.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        className="bg-[#000080] text-white hover:bg-[#000060]"
                                                        onClick={() => handleSavePlacement(student)}
                                                        disabled={savingStudentId === student.id}
                                                    >
                                                        {savingStudentId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#000080]">Siswa Lulus / Nonaktif</CardTitle>
                        <CardDescription>Siswa kelas IX yang ditandai lulus tetap terlihat di sini, tetapi tidak masuk presensi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tingkat</Label>
                                <Select
                                    value={graduatedGradeFilter}
                                    onValueChange={(value) => {
                                        setGraduatedGradeFilter(value);
                                        setGraduatedClassFilter("all");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua tingkat</SelectItem>
                                        {GRADE_FILTERS.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas</Label>
                                <Select
                                    value={graduatedClassFilter}
                                    onValueChange={setGraduatedClassFilter}
                                    disabled={graduatedGradeFilter === "all" || graduatedClassOptions.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua kelas</SelectItem>
                                        {graduatedClassOptions.map((className) => (
                                            <SelectItem key={className} value={className}>{className}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {graduatedStudents.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
                                Tidak ada siswa lulus pada periode ini.
                            </div>
                        ) : filteredGraduatedStudents.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
                                Tidak ada siswa sesuai filter.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Kelas</TableHead>
                                            <TableHead>NISN</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredGraduatedStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-semibold">{student.name}</TableCell>
                                                <TableCell>{student.cls}</TableCell>
                                                <TableCell>{student.nisn}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-slate-300 text-slate-600">LULUS</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => setDetailStudent(student)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!detailStudent} onOpenChange={(open) => !open && setDetailStudent(null)}>
                <DialogContent className="sm:max-w-[760px]">
                    <DialogHeader>
                        <DialogTitle className="text-[#000080]">Detail Siswa Lulus</DialogTitle>
                        <DialogDescription>Data lengkap siswa pada periode {selectedPeriod || "-"}.</DialogDescription>
                    </DialogHeader>
                    {detailStudent && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xl font-black text-slate-900">{detailStudent.name}</p>
                                    <p className="mt-1 text-sm font-medium text-slate-500">NISN {formatValue(detailStudent.nisn)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Kelas {formatValue(detailStudent.cls)}</Badge>
                                    <Badge variant="outline" className="border-slate-300 text-slate-600">LULUS</Badge>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailField label="No Induk" value={detailStudent.noInduk} />
                                <DetailField label="NISN" value={detailStudent.nisn} />
                                <DetailField label="Jenis Kelamin" value={detailStudent.gender === "P" ? "Perempuan" : "Laki-laki"} />
                                <DetailField label="Tahun Ajaran" value={detailStudent.tahun_ajaran || selectedPeriod} />
                                <DetailField label="Tempat Lahir" value={detailStudent.kota} />
                                <DetailField label="Tanggal Lahir" value={detailStudent.tglLahir} />
                                <DetailField label="Alamat" value={detailStudent.alamat} />
                                <DetailField label="Wali / Orang Tua" value={detailStudent.parent} />
                                <DetailField label="NIK Ortu" value={detailStudent.nik_ortu} />
                                <DetailField label="WhatsApp" value={detailStudent.wa} />
                                <DetailField label="Nama Ayah" value={detailStudent.namaAyah} />
                                <DetailField label="Pekerjaan Ayah" value={detailStudent.pekerjaanAyah} />
                                <DetailField label="Nama Ibu" value={detailStudent.namaIbu} />
                                <DetailField label="Pekerjaan Ibu" value={detailStudent.pekerjaanIbu} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
