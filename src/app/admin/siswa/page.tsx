"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Users,
    UserPlus,
    Upload,
    Search,
    Filter,
    FileSpreadsheet,
    MessageCircle,
    Calendar,
    History,
    FileText,
    GraduationCap,
    ArrowUpRight,
    MoreHorizontal,
    Phone,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    ChevronDown,
    MoreVertical,
    Edit2,
    Trash2,
    Copy,
    Bell,
    User,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useKelasData } from "@/hooks/useKelasData";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useIzinData } from "@/hooks/useIzinData";
import { useOrtuData } from "@/hooks/useOrtuData";
import { getApiBaseUrl, getUploadUrl } from "@/lib/api-config";
import { toast } from "sonner";

const SISWA_IMPORT_HEADERS = [
    "noInduk",
    "nisn",
    "name",
    "gender",
    "cls",
    "tglLahir",
    "kota",
    "alamat",
    "namaAyah",
    "pekerjaanAyah",
    "namaIbu",
    "pekerjaanIbu",
    "parent",
    "nik_ortu",
    "email_ortu",
    "wa",
];

const normalizeImportHeader = (header: string) =>
    header
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "");

const getImportCellValue = (row: Record<string, unknown>, aliases: string[]) => {
    for (const alias of aliases) {
        const value = row[alias];
        if (value !== undefined && value !== null) return String(value).trim();
    }
    return "";
};

const normalizeNumericText = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d+(\.0+)?$/.test(trimmed)) return trimmed.replace(/\.0+$/, "");

    const scientific = trimmed.match(/^(\d+(?:\.\d+)?)e\+?(\d+)$/i);
    if (scientific) {
        const digits = scientific[1].replace(".", "");
        const decimals = (scientific[1].split(".")[1] || "").length;
        const zeroCount = Number(scientific[2]) - decimals;
        if (zeroCount >= 0) return `${digits}${"0".repeat(zeroCount)}`;
    }

    return trimmed;
};

const isScientificNumericText = (value: string) => /^\d+(?:\.\d+)?e\+?\d+$/i.test(value.trim());

const normalizeClassName = (value: string) => {
    const raw = value.trim().toUpperCase().replace(/^KELAS\s+/, "");
    if (!raw) return "";

    const compact = raw.replace(/\s+/g, "");
    const gradeMap: Record<string, string> = {
        "7": "VII",
        "VII": "VII",
        "8": "VIII",
        "VIII": "VIII",
        "9": "IX",
        "IX": "IX",
    };

    const match = compact.match(/^(VII|VIII|IX|7|8|9)([A-Z])$/);
    if (match) return `${gradeMap[match[1]]} ${match[2]}`;

    const spacedMatch = raw.match(/^(VII|VIII|IX|7|8|9)\s+([A-Z])$/);
    if (spacedMatch) return `${gradeMap[spacedMatch[1]]} ${spacedMatch[2]}`;

    return value.trim();
};

const formatExcelDate = (value: string) => {
    if (!value || value === "-" || value === "0") return "-";
    
    // YYYY-MM-DD format (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    
    // Excel Serial Number (e.g. 40493)
    if (/^\d+$/.test(value)) {
        const serial = parseInt(value, 10);
        // Heuristic: Excel serials for realistic birth dates (1940 - 2040)
        if (serial > 10000 && serial < 60000) {
            try {
                const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            } catch (e) {}
        }
    }
    
    // DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmyMatch) {
        const [_, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return value;
};

export default function AdminSiswaPage() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [searchQuery, setSearchQuery] = useState("");
    const siswaImportInputRef = useRef<HTMLInputElement | null>(null);
    const siswaConverterInputRef = useRef<HTMLInputElement | null>(null);
    const [isImportingSiswa, setIsImportingSiswa] = useState(false);
    const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([]);
    const [isBatchDeletingSiswa, setIsBatchDeletingSiswa] = useState(false);

    const { siswa: siswaData, loading: siswaLoading, error: siswaError, refetch } = useSiswaData();
    const { kelas: kelasList } = useKelasData();
    const { ortu: ortuList, refetch: refetchOrtu } = useOrtuData();

    const [isAddSiswaOpen, setIsAddSiswaOpen] = useState(false);
    const [newSiswaNisn, setNewSiswaNisn] = useState("");
    const [newSiswaNama, setNewSiswaNama] = useState("");
    const [newSiswaKelas, setNewSiswaKelas] = useState("");
    const [newSiswaGender, setNewSiswaGender] = useState("");
    const [newOrtuNama, setNewOrtuNama] = useState("");
    const [newOrtuWa, setNewOrtuWa] = useState("");
    const [newNikOrtu, setNewNikOrtu] = useState("");
    
    // Additional Add States
    const [newNoInduk, setNewNoInduk] = useState("");
    const [newKota, setNewKota] = useState("");
    const [newTglLahir, setNewTglLahir] = useState("");
    const [newAlamat, setNewAlamat] = useState("");
    const [newNamaAyah, setNewNamaAyah] = useState("");
    const [newPekerjaanAyah, setNewPekerjaanAyah] = useState("");
    const [newNamaIbu, setNewNamaIbu] = useState("");
    const [newPekerjaanIbu, setNewPekerjaanIbu] = useState("");
    
    const [isSaving, setIsSaving] = useState(false);

    // Edit Siswa State
    const [editSiswa, setEditSiswa] = useState<any>(null);
    const [editSiswaNisn, setEditSiswaNisn] = useState("");
    const [editSiswaNama, setEditSiswaNama] = useState("");
    const [editSiswaKelas, setEditSiswaKelas] = useState("");
    const [editSiswaGender, setEditSiswaGender] = useState("");
    const [editOrtuNama, setEditOrtuNama] = useState("");
    const [editOrtuWa, setEditOrtuWa] = useState("");
    const [editNikOrtu, setEditNikOrtu] = useState("");
    
    // Additional Edit States
    const [editTglLahir, setEditTglLahir] = useState("");
    const [editKota, setEditKota] = useState("");
    const [editAlamat, setEditAlamat] = useState("");
    const [editNamaAyah, setEditNamaAyah] = useState("");
    const [editPekerjaanAyah, setEditPekerjaanAyah] = useState("");
    const [editNamaIbu, setEditNamaIbu] = useState("");
    const [editPekerjaanIbu, setEditPekerjaanIbu] = useState("");
    
    const [isEditSaving, setIsEditSaving] = useState(false);

    const [detailSiswa, setDetailSiswa] = useState<any>(null);
    const [filterTingkat, setFilterTingkat] = useState("all");
    const [filterAbjad, setFilterAbjad] = useState<string[]>([]);
    const [isRombelFilterOpen, setIsRombelFilterOpen] = useState(false);
    const [tempFilterAbjad, setTempFilterAbjad] = useState<string[]>([]);
    const [rombelSearchQuery, setRombelSearchQuery] = useState("");

    // Monitoring & Real Data Sync
    const { attendance: recentPresensi, loading: presensiLoading } = useAttendanceData();
    const { izin: recentIzin, loading: izinLoading, refetch: refetchIzin } = useIzinData();

    const [dispSiswaName, setDispSiswaName] = useState("");
    const [dispSelectedKelas, setDispSelectedKelas] = useState("");
    const [dispSelectedSiswaId, setDispSelectedSiswaId] = useState("");
    const [dispKeperluan, setDispKeperluan] = useState("");
    const [dispStartDate, setDispStartDate] = useState("");
    const [dispEndDate, setDispEndDate] = useState("");
    const [previewSurat, setPreviewSurat] = useState<any>(null);
    const [dispSearchQuery, setDispSearchQuery] = useState("");
    const [dispFilterStatus, setDispFilterStatus] = useState("ALL");
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
    const [dispProofFile, setDispProofFile] = useState<File | null>(null);

    const findOrtuByNik = (nik: string) => {
        const normalizedNik = normalizeNumericText(nik || "");
        return ortuList.find(o => normalizeNumericText(o.nik || "") === normalizedNik);
    };

    const applyOrtuToNewForm = (nik: string) => {
        setNewNikOrtu(nik);
        const selected = findOrtuByNik(nik);
        if (selected) {
            setNewOrtuNama(selected.name || "");
            setNewOrtuWa(selected.phone || "");
            setNewNamaAyah(selected.namaAyah || "");
            setNewPekerjaanAyah(selected.pekerjaanAyah || "");
            setNewNamaIbu(selected.namaIbu || "");
            setNewPekerjaanIbu(selected.pekerjaanIbu || "");
        }
    };

    const applyOrtuToEditForm = (nik: string) => {
        setEditNikOrtu(nik);
        const selected = findOrtuByNik(nik);
        if (selected) {
            setEditOrtuNama(selected.name || "");
            setEditOrtuWa(selected.phone || "");
            setEditNamaAyah(selected.namaAyah || "");
            setEditPekerjaanAyah(selected.pekerjaanAyah || "");
            setEditNamaIbu(selected.namaIbu || "");
            setEditPekerjaanIbu(selected.pekerjaanIbu || "");
        }
    };

    const normalizeSiswaImportRow = (row: Record<string, unknown>) => {
        const normalized = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeImportHeader(key), value])
        );

        const nisn = normalizeNumericText(getImportCellValue(normalized, ["nisn", "nis", "nomor_induk_siswa_nasional"]));
        const noInduk = normalizeNumericText(getImportCellValue(normalized, ["noinduk", "no_induk", "nomor_induk", "nis"]));
        const gender = (getImportCellValue(normalized, ["gender", "jk", "jenis_kelamin"]) || "L").toUpperCase();
        const cls = normalizeClassName(getImportCellValue(normalized, ["cls", "kelas", "class", "rombel"]));
        const namaAyah = getImportCellValue(normalized, ["namaayah", "nama_ayah", "ayah"]);
        const pekerjaanAyah = getImportCellValue(normalized, ["pekerjaanayah", "pekerjaan_ayah", "job_ayah"]);
        const namaIbu = getImportCellValue(normalized, ["namaibu", "nama_ibu", "ibu"]);
        const pekerjaanIbu = getImportCellValue(normalized, ["pekerjaanibu", "pekerjaan_ibu", "job_ibu"]);
        const parent = getImportCellValue(normalized, ["parent", "wali", "nama_wali", "nama_ortu", "nama_orang_tua"]) || namaAyah || namaIbu;
        const rawNikOrtu = getImportCellValue(normalized, ["nik_ortu", "nikortu", "nik_orang_tua", "nik_wali", "nik"]);
        const nikOrtu = normalizeNumericText(rawNikOrtu);
        const wa = normalizeNumericText(getImportCellValue(normalized, ["wa", "phone", "no_wa", "nowa", "no_whatsapp", "nowhatsapp", "no_telp", "no_telepon", "telepon"]));
        const emailOrtu = getImportCellValue(normalized, ["email_ortu", "emailortu", "email_orang_tua", "email_wali", "email"]);

        return {
            noInduk: noInduk || nisn,
            nisn,
            name: getImportCellValue(normalized, ["name", "nama", "nama_siswa"]),
            gender: gender === "P" ? "P" : "L",
            cls,
            tglLahir: formatExcelDate(getImportCellValue(normalized, ["tgllahir", "tgl_lahir", "tanggal_lahir"])),
            kota: getImportCellValue(normalized, ["kota", "kota_lahir", "tempat_lahir"]),
            alamat: getImportCellValue(normalized, ["alamat", "alamat_lengkap"]),
            namaAyah: namaAyah || "-",
            pekerjaanAyah: pekerjaanAyah || "-",
            namaIbu: namaIbu || "-",
            pekerjaanIbu: pekerjaanIbu || "-",
            parent: parent || "-",
            nik_ortu_raw: rawNikOrtu,
            nik_ortu: nikOrtu || "-",
            email_ortu: emailOrtu,
            wa: wa || "-",
            status: nikOrtu && wa ? "ok" : "fail",
            tahun_ajaran: selectedTahunAjaran,
        };
    };

    const rowsFromFirstSheet = (sheet: XLSX.WorkSheet) => {
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
        const headerIndex = rawRows.findIndex((row) => {
            const headers = row.map((cell) => normalizeImportHeader(String(cell)));
            return headers.some(h => ["nisn", "nis", "noinduk", "no_induk"].includes(h)) &&
                headers.some(h => ["name", "nama", "nama_siswa"].includes(h));
        });

        if (headerIndex === -1) return null;

        const headers = rawRows[headerIndex].map((cell) => String(cell).trim());
        return rawRows.slice(headerIndex + 1)
            .filter((row) => row.some((cell) => String(cell).trim() !== ""))
            .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
    };

    const handleImportSiswaFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingSiswa(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = rowsFromFirstSheet(sheet);

            if (!rows) {
                toast.error("Header import tidak ditemukan. Pastikan ada kolom nisn/noInduk dan name/nama.");
                return;
            }

            if (rows.length === 0) {
                toast.error("File import siswa kosong");
                return;
            }

            const seenNisn = new Set<string>();
            const existingSiswaByNisn = new Map(siswaData.map((s) => [normalizeNumericText(s.nisn || ""), s]));
            const validRows: ReturnType<typeof normalizeSiswaImportRow>[] = [];
            const updateRows: Array<ReturnType<typeof normalizeSiswaImportRow> & { id: number }> = [];
            const parentRowsByNik = new Map<string, ReturnType<typeof normalizeSiswaImportRow>>();
            let missingNisn = 0;
            let missingName = 0;
            let missingClass = 0;
            let missingNikOrtu = 0;
            let invalidNikOrtu = 0;
            let scientificNikOrtu = 0;
            let duplicate = 0;
            const parentContactByNik = new Map<string, { email?: string; wa?: string }>();
            const conflictingParentNik = new Set<string>();
            const mergeParentRow = (
                current: ReturnType<typeof normalizeSiswaImportRow> | undefined,
                next: ReturnType<typeof normalizeSiswaImportRow>
            ) => {
                if (!current) return next;
                const preferFilled = (currentValue: string, nextValue: string) =>
                    currentValue && currentValue !== "-" ? currentValue : nextValue;

                return {
                    ...current,
                    parent: preferFilled(current.parent, next.parent),
                    email_ortu: preferFilled(current.email_ortu, next.email_ortu),
                    wa: preferFilled(current.wa, next.wa),
                    namaAyah: preferFilled(current.namaAyah, next.namaAyah),
                    pekerjaanAyah: preferFilled(current.pekerjaanAyah, next.pekerjaanAyah),
                    namaIbu: preferFilled(current.namaIbu, next.namaIbu),
                    pekerjaanIbu: preferFilled(current.pekerjaanIbu, next.pekerjaanIbu),
                };
            };

            for (const row of rows) {
                const data = normalizeSiswaImportRow(row);
                if (!data.nisn) {
                    missingNisn++;
                    continue;
                }
                if (!data.name) {
                    missingName++;
                    continue;
                }
                if (!data.cls) {
                    missingClass++;
                    continue;
                }
                if (!data.nik_ortu || data.nik_ortu === "-") {
                    missingNikOrtu++;
                    continue;
                }
                if (isScientificNumericText(data.nik_ortu_raw)) {
                    scientificNikOrtu++;
                    continue;
                }
                if (!/^\d+$/.test(data.nik_ortu)) {
                    invalidNikOrtu++;
                    continue;
                }
                const previousContact = parentContactByNik.get(data.nik_ortu) || {};
                const email = data.email_ortu.trim().toLowerCase();
                const wa = data.wa !== "-" ? data.wa.trim() : "";
                if ((previousContact.email && email && previousContact.email !== email) ||
                    (previousContact.wa && wa && previousContact.wa !== wa)) {
                    conflictingParentNik.add(data.nik_ortu);
                    continue;
                }
                parentContactByNik.set(data.nik_ortu, {
                    email: previousContact.email || email || undefined,
                    wa: previousContact.wa || wa || undefined,
                });
                parentRowsByNik.set(data.nik_ortu, mergeParentRow(parentRowsByNik.get(data.nik_ortu), data));
                if (seenNisn.has(data.nisn)) {
                    duplicate++;
                    continue;
                }
                seenNisn.add(data.nisn);
                const existingSiswa = existingSiswaByNisn.get(data.nisn);
                if (existingSiswa) {
                    updateRows.push({
                        ...data,
                        id: existingSiswa.id,
                        noInduk: data.noInduk || existingSiswa.noInduk || data.nisn,
                    });
                } else {
                    validRows.push(data);
                }
            }

            if (scientificNikOrtu > 0) {
                toast.error(`${scientificNikOrtu} baris NIK ortu terbaca format scientific seperti 3.57101E+15. Format ulang kolom NIK sebagai Text, isi ulang NIK lengkap, lalu export CSV lagi.`);
                return;
            }

            if (conflictingParentNik.size > 0) {
                toast.error(`${conflictingParentNik.size} NIK ortu dipakai untuk data orang tua yang berbeda. Perbaiki NIK agar setiap keluarga punya NIK unik yang lengkap.`);
                return;
            }

            if (validRows.length === 0 && updateRows.length === 0 && parentRowsByNik.size === 0) {
                toast.error(`Tidak ada baris valid. Kosong NISN: ${missingNisn}, kosong nama: ${missingName}, kosong kelas: ${missingClass}, kosong NIK ortu: ${missingNikOrtu}, NIK ortu salah: ${invalidNikOrtu}, duplikat: ${duplicate}.`);
                return;
            }

            const parentPayloads = Array.from(parentRowsByNik.entries()).map(([nik, row]) => ({
                nik,
                name: row.parent !== "-" ? row.parent : (row.namaAyah !== "-" ? row.namaAyah : row.namaIbu !== "-" ? row.namaIbu : `Orang Tua ${row.name}`),
                email: row.email_ortu || null,
                phone: row.wa !== "-" ? row.wa : null,
                namaAyah: row.namaAyah !== "-" ? row.namaAyah : null,
                pekerjaanAyah: row.pekerjaanAyah !== "-" ? row.pekerjaanAyah : null,
                namaIbu: row.namaIbu !== "-" ? row.namaIbu : null,
                pekerjaanIbu: row.pekerjaanIbu !== "-" ? row.pekerjaanIbu : null,
                password: "password123",
                status: "AKTIF",
            }));

            const parentRes = await fetch(`${getApiBaseUrl()}/ortu/index.php?action=bulk-upsert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parentPayloads),
            });
            const parentData = await parentRes.json().catch(() => null);
            const parentCreated = Number(parentData?.created || 0);
            const parentUpdated = Number(parentData?.updated || 0);
            const parentFailed = Number(parentData?.failed || 0);

            if (parentData?.status !== "success") {
                toast.error(parentData?.message || "Gagal menyiapkan data orang tua dari file import.");
                return;
            }

            if (parentFailed > 0) {
                toast.error(`Import dibatalkan. ${parentFailed} data orang tua gagal diproses, jadi siswa belum dimasukkan agar link ortu tidak putus.`);
                refetchOrtu();
                return;
            }

            let siswaUpdated = 0;
            let siswaUpdateFailed = 0;

            for (const row of updateRows) {
                const updateRes = await fetch(`${getApiBaseUrl()}/siswa/index.php`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(row),
                });
                const updateData = await updateRes.json().catch(() => null);
                if (updateData?.status === "success") siswaUpdated++;
                else siswaUpdateFailed++;
            }

            if (validRows.length === 0) {
                const skipped = missingNisn + missingName + missingClass + missingNikOrtu + invalidNikOrtu + duplicate;
                toast.success(`Link siswa-ortu berhasil disinkronkan. Siswa diperbarui: ${siswaUpdated}, gagal: ${siswaUpdateFailed}. Ortu: ${parentCreated} baru, ${parentUpdated} diperbarui. ${skipped} baris dilewati.`);
                refetch();
                refetchOrtu();
                return;
            }

            const res = await fetch(`${getApiBaseUrl()}/siswa/index.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validRows),
            });
            const data = await res.json();

            if (data.status === "success") {
                const skipped = missingNisn + missingName + missingClass + missingNikOrtu + invalidNikOrtu + duplicate;
                toast.success(`${validRows.length} siswa baru diimport, ${siswaUpdated} siswa lama diperbarui. Ortu: ${parentCreated} baru, ${parentUpdated} diperbarui. Gagal update siswa: ${siswaUpdateFailed}. ${skipped} baris dilewati.`);
                const importedAbjads = validRows.map((row) => row.cls.split(" ")[1]).filter(Boolean);
                const visibleAbjads = Array.from(new Set([...availableAbjads, ...importedAbjads])).sort();
                setSearchQuery("");
                setFilterTingkat("all");
                setFilterAbjad(visibleAbjads);
                setTempFilterAbjad(visibleAbjads);
                refetch();
                refetchOrtu();
            } else {
                toast.error(data.message || "Gagal import siswa");
            }
        } catch (error) {
            toast.error("Gagal membaca file siswa. Gunakan CSV, XLS, atau XLSX dengan header sesuai template.");
        } finally {
            setIsImportingSiswa(false);
            event.target.value = "";
        }
    };

    const handleConvertSiswaExcelToCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const baseName = file.name.replace(/\.(xlsx|xls)$/i, "");

            link.href = url;
            link.download = `${baseName || "data_siswa_ortu"}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Sheet "${sheetName}" berhasil dikonversi ke CSV.`);
        } catch (error) {
            toast.error("Gagal mengonversi Excel siswa. Pastikan file berformat XLS atau XLSX.");
        } finally {
            event.target.value = "";
        }
    };

    const downloadSiswaTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            {
                noInduk: "SIS-001",
                nisn: "1000000001",
                name: "Nama Siswa",
                gender: "L",
                cls: "VII A",
                tglLahir: "2012-02-10",
                kota: "Jakarta",
                alamat: "Jl. Contoh No. 1",
                namaAyah: "Hasan Fauzi",
                pekerjaanAyah: "Karyawan",
                namaIbu: "Siti Aminah",
                pekerjaanIbu: "Ibu Rumah Tangga",
                parent: "Hasan Fauzi",
                nik_ortu: "3174000000000001",
                email_ortu: "hasan@example.com",
                wa: "081300000001",
            },
        ], { header: SISWA_IMPORT_HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "template_siswa_ortu");
        XLSX.writeFile(workbook, "template_import_siswa_ortu.xlsx");
    };

    const filteredSiswaForDisp = useMemo(() => {
        if (!dispSelectedKelas) return [];
        return siswaData.filter(s => s.cls === dispSelectedKelas).sort((a, b) => a.name.localeCompare(b.name));
    }, [siswaData, dispSelectedKelas]);

    const filteredDispHistory = useMemo(() => {
        return recentIzin.filter(i => {
            const matchSearch = i.student_name.toLowerCase().includes(dispSearchQuery.toLowerCase());
            const matchStatus = dispFilterStatus === "ALL" || i.status === dispFilterStatus;
            return matchSearch && matchStatus;
        });
    }, [recentIzin, dispSearchQuery, dispFilterStatus]);

    // Monitoring Unified Logs
    const monitoringLogs = useMemo(() => {
        const presensiMapped = recentPresensi.map(p => ({
            id: `p-${p.id}`,
            time: p.created_at,
            rawTime: p.created_at,
            name: p.student_name,
            status: p.status === 'HADIR' ? 'HADIR' : (p.status === 'ALPHA' ? 'ALPHA' : p.status),
            ket: `${p.status === 'HADIR' ? 'Presensi Masuk' : 'Tidak ada keterangan'} (Mapel: ${p.subject_name || '-'})`,
            type: p.status === 'HADIR' ? 'H' : 'A',
            source: 'presensi'
        }));

        const izinMapped = recentIzin.map(i => ({
            id: `i-${i.id}`,
            time: i.start_date,
            rawTime: i.created_at,
            name: i.student_name,
            status: i.type,
            ket: `${i.reason} (Validasi: ${i.status})`,
            type: i.type === 'SAKIT' ? 'S' : (i.type === 'IZIN' ? 'I' : 'D'),
            source: 'izin',
            attachment: i.attachment_url
        }));

        return [...presensiMapped, ...izinMapped].sort((a, b) => 
            new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime()
        ).slice(0, 50); // Show last 50
    }, [recentPresensi, recentIzin]);

    // Active Dispensations
    const dispensasiData = useMemo(() => {
        return recentIzin.filter(i => (i.type === 'IZIN' || i.type === 'SAKIT') && i.status === 'APPROVED');
    }, [recentIzin]);

    // Ambil daftar abjad unik dari database (A, B, C...)
    const availableAbjads = Array.from(new Set(kelasList.map(k => k.name.split(" ").slice(-1)[0]))).sort();
    const availableTingkats = Array.from(new Set(kelasList.map(k => k.grade))).sort();

    useEffect(() => {
        if (kelasList.length > 0) {
            setFilterAbjad(availableAbjads);
            setTempFilterAbjad(availableAbjads);
        }
    }, [kelasList]);

    const filteredSiswa = siswaData.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery);
        
        const clsParts = s.cls.split(" ");
        const tingkat = clsParts[0];
        const abjad = clsParts[1];
        
        const matchTingkat = filterTingkat === "all" || tingkat === filterTingkat;
        const matchAbjad = filterAbjad.length === 0 || !abjad || filterAbjad.includes(abjad);
        
        return matchSearch && matchTingkat && matchAbjad;
    });
    const filteredSiswaIds = filteredSiswa.map((s) => s.id);
    const selectedFilteredSiswaIds = selectedSiswaIds.filter((id) => filteredSiswaIds.includes(id));
    const isAllFilteredSiswaSelected = filteredSiswa.length > 0 && selectedFilteredSiswaIds.length === filteredSiswa.length;

    const toggleSelectAllFilteredSiswa = (checked: boolean) => {
        setSelectedSiswaIds((current) => {
            const next = new Set(current);
            if (checked) {
                filteredSiswaIds.forEach((id) => next.add(id));
            } else {
                filteredSiswaIds.forEach((id) => next.delete(id));
            }
            return Array.from(next);
        });
    };

    const toggleSelectSiswa = (id: number, checked: boolean) => {
        setSelectedSiswaIds((current) =>
            checked ? Array.from(new Set([...current, id])) : current.filter((selectedId) => selectedId !== id)
        );
    };

    const handleSaveSiswa = () => {
        if (!newSiswaNisn || !newSiswaNama || !newSiswaKelas || !newOrtuNama) {
            toast.error("Mohon lengkapi setidaknya NISN, Nama, Kelas, dan Wali!");
            return;
        }

        setIsSaving(true);
        const newSiswa = {
            noInduk: newNoInduk || newSiswaNisn,
            nisn: newSiswaNisn,
            name: newSiswaNama,
            gender: newSiswaGender || "L",
            tglLahir: newTglLahir || "-",
            kota: newKota || "-",
            alamat: newAlamat || "-",
            namaAyah: newNamaAyah || "-",
            pekerjaanAyah: newPekerjaanAyah || "-",
            namaIbu: newNamaIbu || "-",
            pekerjaanIbu: newPekerjaanIbu || "-",
            cls: newSiswaKelas,
            parent: newOrtuNama,
            nik_ortu: newNikOrtu,
            wa: newOrtuWa || "-",
            status: newOrtuWa && newOrtuWa.length > 5 ? "ok" : "fail",
            tahun_ajaran: selectedTahunAjaran
        };
        
        fetch(`${getApiBaseUrl()}/siswa/index.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSiswa)
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === "success") {
                toast.success(`Data Siswa ${newSiswaNama} berhasil ditambahkan!`);
                refetch();
                setIsAddSiswaOpen(false);
                
                // Reset form
                setNewSiswaNisn("");
                setNewSiswaNama("");
                setNewSiswaKelas("");
                setNewSiswaGender("");
                setNewOrtuNama("");
                setNewOrtuWa("");
                setNewNoInduk("");
                setNewKota("");
                setNewTglLahir("");
                setNewAlamat("");
                setNewNamaAyah("");
                setNewPekerjaanAyah("");
                setNewNamaIbu("");
                setNewPekerjaanIbu("");
                setNewNikOrtu("");
            } else {
                toast.error(data.message);
            }
        })
        .catch(err => {
            toast.error("Gagal menyimpan data ke server!");
            console.error(err);
        })
        .finally(() => {
            setIsSaving(false);
        });
    };

    const handleEditSiswaClick = (s: any) => {
        setEditSiswa(s);
        setEditSiswaNisn(s.nisn);
        setEditSiswaNama(s.name);
        setEditSiswaKelas(s.cls);
        setEditSiswaGender(s.gender || "L"); 
        const linkedOrtu = findOrtuByNik(s.nik_ortu || "");
        setEditNikOrtu(linkedOrtu?.nik || s.nik_ortu || "");
        setEditOrtuNama(linkedOrtu?.name || s.parent);
        setEditOrtuWa(linkedOrtu?.phone || (s.wa !== "-" ? s.wa : ""));
        
        // Load additional fields
        setEditTglLahir(s.tglLahir || "");
        setEditKota(s.kota || "");
        setEditAlamat(s.alamat || "");
        setEditNamaAyah(linkedOrtu?.namaAyah || s.namaAyah || "");
        setEditPekerjaanAyah(linkedOrtu?.pekerjaanAyah || s.pekerjaanAyah || "");
        setEditNamaIbu(linkedOrtu?.namaIbu || s.namaIbu || "");
        setEditPekerjaanIbu(linkedOrtu?.pekerjaanIbu || s.pekerjaanIbu || "");
    };

    const handleSaveEditSiswa = () => {
        if (!editSiswaNisn || !editSiswaNama || !editSiswaKelas || !editOrtuNama) {
            toast.error("Mohon lengkapi bagian NISN, Nama, Kelas, dan Nama Ortu!");
            return;
        }

        setIsEditSaving(true);
        const updatedSiswa = {
            id: editSiswa.id,
            noInduk: editSiswa.noInduk,
            nisn: editSiswaNisn,
            name: editSiswaNama,
            cls: editSiswaKelas,
            gender: editSiswaGender,
            parent: editOrtuNama,
            wa: editOrtuWa || "-",
            tglLahir: editTglLahir,
            kota: editKota,
            alamat: editAlamat,
            namaAyah: editNamaAyah,
            pekerjaanAyah: editPekerjaanAyah,
            namaIbu: editNamaIbu,
            pekerjaanIbu: editPekerjaanIbu,
            nik_ortu: editNikOrtu,
            status: editOrtuWa && editOrtuWa.length > 5 ? "ok" : "fail",
            tahun_ajaran: selectedTahunAjaran
        };

        fetch(`${getApiBaseUrl()}/siswa/index.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSiswa)
        })
        .then(res => res.json())
        .then(json => {
            if (json.status === "success") {
                toast.success(`Profil ${editSiswaNama} berhasil diperbarui secara permanen`);
                setEditSiswa(null);
                refetch(); // Reload data from server
            } else {
                toast.error("Gagal menyimpan: " + json.message);
            }
        })
        .catch(err => {
            toast.error("Terjadi kesalahan koneksi");
            console.error(err);
        })
        .finally(() => {
            setIsEditSaving(false);
        });
    };

    const handleDeleteSiswa = (id: number, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
            fetch(`${getApiBaseUrl()}/siswa/index.php?id=${id}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") {
                    toast.success(`Data siswa ${name} berhasil dihapus dari sistem`);
                    setDetailSiswa(null);
                    refetch();
                } else {
                    toast.error("Gagal menghapus: " + json.message);
                }
            })
            .catch(err => {
                toast.error("Terjadi kesalahan koneksi");
                console.error(err);
            });
        }
    };

    const handleBatchDeleteSiswa = async () => {
        if (selectedSiswaIds.length === 0 || isBatchDeletingSiswa) return;
        if (!window.confirm(`Hapus ${selectedSiswaIds.length} data siswa terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;

        setIsBatchDeletingSiswa(true);
        try {
            const results = await Promise.allSettled(
                selectedSiswaIds.map((id) =>
                    fetch(`${getApiBaseUrl()}/siswa/index.php?id=${id}`, { method: "DELETE" })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.status !== "success") throw new Error(data.message || "Gagal menghapus siswa");
                            return data;
                        })
                )
            );
            const successCount = results.filter((result) => result.status === "fulfilled").length;
            const failedCount = selectedSiswaIds.length - successCount;

            if (successCount > 0) toast.success(`${successCount} data siswa berhasil dihapus.`);
            if (failedCount > 0) toast.error(`${failedCount} data siswa gagal dihapus.`);

            setSelectedSiswaIds([]);
            refetch();
        } catch (error) {
            toast.error("Gagal menghapus data siswa terpilih.");
        } finally {
            setIsBatchDeletingSiswa(false);
        }
    };

    const handleMakeSurat = () => {
        if (!dispSelectedSiswaId || !dispKeperluan || !dispStartDate) {
            toast.error("Mohon pilih Siswa, isi Keperluan, dan setidaknya Tanggal Mulai!");
            return;
        }
        setPreviewSurat({
            id: dispSelectedSiswaId,
            name: dispSiswaName,
            cls: dispSelectedKelas,
            reason: dispKeperluan,
            date: dispEndDate ? `${dispStartDate} s/d ${dispEndDate}` : dispStartDate,
            start: dispStartDate,
            end: dispEndDate || dispStartDate
        });
    };

    const handlePrintSurat = async () => {
        try {
            let attachmentUrl = "OFFICIAL_LETTER";

            if (dispProofFile) {
                const formData = new FormData();
                formData.append("file", dispProofFile);
                const uploadRes = await fetch(`${getApiBaseUrl()}/izin/upload.php`, {
                    method: "POST",
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.status === "success") {
                    attachmentUrl = uploadData.url;
                }
            }

            const res = await fetch(`${getApiBaseUrl()}/izin/index.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: previewSurat.id,
                    type: "IZIN",
                    startDate: previewSurat.start,
                    endDate: previewSurat.end,
                    reason: previewSurat.reason,
                    status: "APPROVED",
                    attachmentUrl: attachmentUrl
                })
            });

            const data = await res.json();
            if (data.status === "success") {
                window.print(); // Opens browser print dialog
                toast.success(`Surat dispensasi untuk ${previewSurat.name} berhasil disimpan dan diterbitkan!`);
                setPreviewSurat(null);
                setDispSiswaName("");
                setDispSelectedKelas("");
                setDispSelectedSiswaId("");
                setDispKeperluan("");
                setDispStartDate("");
                setDispEndDate("");
                setDispProofFile(null);
                refetchIzin(); // Refresh real data
            } else {
                toast.error("Gagal menyimpan ke database: " + data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan koneksi saat menyimpan data.");
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Siswa</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Pusat data siswa, sinkronisasi orang tua, dan log kehadiran individual.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold" onClick={downloadSiswaTemplate}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Template
                    </Button>
                    <input
                        ref={siswaConverterInputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        className="hidden"
                        onChange={handleConvertSiswaExcelToCsv}
                    />
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold" onClick={() => siswaConverterInputRef.current?.click()}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Convert Excel ke CSV
                    </Button>
                    <input
                        ref={siswaImportInputRef}
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        className="hidden"
                        onChange={handleImportSiswaFile}
                    />
                    <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50 font-bold" onClick={() => siswaImportInputRef.current?.click()} disabled={isImportingSiswa}>
                        {isImportingSiswa ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isImportingSiswa ? "Mengimpor..." : "Import Siswa + Ortu"}
                    </Button>
                    <Dialog open={isAddSiswaOpen} onOpenChange={setIsAddSiswaOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-[#000080] hover:bg-[#000060] text-white font-bold shadow-md">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Tambah Siswa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px]">
                                <DialogHeader>
                                    <DialogTitle>Tambah Siswa Baru</DialogTitle>
                                    <DialogDescription>Masukkan data identitas siswa secara lengkap sesuai database.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold text-[#000080]">Identitas Dasar</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="nisn">NISN</Label>
                                                <Input id="nisn" placeholder="Contoh: 001234xxxx" value={newSiswaNisn} onChange={e => setNewSiswaNisn(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="no_induk">No. Induk</Label>
                                                <Input id="no_induk" placeholder="Contoh: 1122" value={newNoInduk} onChange={e => setNewNoInduk(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nama Lengkap</Label>
                                            <Input id="name" placeholder="Nama Lengkap Siswa" value={newSiswaNama} onChange={e => setNewSiswaNama(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="kelas">Kelas</Label>
                                                <Select value={newSiswaKelas} onValueChange={setNewSiswaKelas}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="VII A">VII A</SelectItem>
                                                        <SelectItem value="VII B">VII B</SelectItem>
                                                        <SelectItem value="VII C">VII C</SelectItem>
                                                        <SelectItem value="VII D">VII D</SelectItem>
                                                        <SelectItem value="VII E">VII E</SelectItem>
                                                        <SelectItem value="VIII A">VIII A</SelectItem>
                                                        <SelectItem value="VIII B">VIII B</SelectItem>
                                                        <SelectItem value="VIII C">VIII C</SelectItem>
                                                        <SelectItem value="VIII D">VIII D</SelectItem>
                                                        <SelectItem value="VIII E">VIII E</SelectItem>
                                                        <SelectItem value="IX A">IX A</SelectItem>
                                                        <SelectItem value="IX B">IX B</SelectItem>
                                                        <SelectItem value="IX C">IX C</SelectItem>
                                                        <SelectItem value="IX D">IX D</SelectItem>
                                                        <SelectItem value="IX E">IX E</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Jenis Kelamin</Label>
                                                <Select value={newSiswaGender} onValueChange={setNewSiswaGender}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="L">Laki-laki</SelectItem>
                                                        <SelectItem value="P">Perempuan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-sm font-bold text-[#000080]">Asal & Tanggal Lahir</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="kota">Kota Lahir</Label>
                                                <Input id="kota" placeholder="Contoh: Sidoarjo" value={newKota} onChange={e => setNewKota(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
                                                <Input id="tgl_lahir" type="date" value={newTglLahir} onChange={e => setNewTglLahir(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="alamat">Alamat Lengkap</Label>
                                            <Input id="alamat" placeholder="Jl. Contoh No. 123..." value={newAlamat} onChange={e => setNewAlamat(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-sm font-bold text-[#000080]">Data Orang Tua / Wali</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ayah">Nama Ayah</Label>
                                                <Input id="ayah" placeholder="Nama Ayah" value={newNamaAyah} onChange={e => setNewNamaAyah(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="p_ayah">Pekerjaan Ayah</Label>
                                                <Input id="p_ayah" placeholder="Contoh: Pegawai" value={newPekerjaanAyah} onChange={e => setNewPekerjaanAyah(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ibu">Nama Ibu</Label>
                                                <Input id="ibu" placeholder="Nama Ibu" value={newNamaIbu} onChange={e => setNewNamaIbu(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="p_ibu">Pekerjaan Ibu</Label>
                                                <Input id="p_ibu" placeholder="Contoh: Wiraswasta" value={newPekerjaanIbu} onChange={e => setNewPekerjaanIbu(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ortu">Pilih Akun Orang Tua (Link Database)</Label>
                                                <Select value={newNikOrtu} onValueChange={applyOrtuToNewForm}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih Wali" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="-">Belum ada Akun</SelectItem>
                                                        {ortuList.map(o => (
                                                            <SelectItem key={o.nik} value={o.nik}>{o.name} ({o.nik})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ortu_nama">Nama Wali (Display)</Label>
                                                <Input id="ortu_nama" placeholder="Nama Wali" value={newOrtuNama} onChange={e => setNewOrtuNama(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="wa">No. Telepon (WA)</Label>
                                                <Input id="wa" placeholder="081xxxx..." value={newOrtuWa} onChange={e => setNewOrtuWa(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <Button variant="outline" onClick={() => setIsAddSiswaOpen(false)}>Batal</Button>
                                    <Button onClick={handleSaveSiswa} disabled={isSaving} className="bg-[#000080] hover:bg-blue-900 text-white min-w-[150px]">
                                        {isSaving ? "Menyimpan..." : "Simpan Data Siswa"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                </div>
            </div>

            <Tabs defaultValue="directory" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-2 lg:inline-flex h-auto lg:h-12 gap-1 lg:gap-0">
                    <TabsTrigger value="directory" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Data Siswa
                    </TabsTrigger>
                    <TabsTrigger value="monitoring" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <History className="w-4 h-4 mr-2" />
                        Log & Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="dispensation" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10">
                        <FileText className="w-4 h-4 mr-2" />
                        Dispensasi
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: DIRECTORY (DATA SISWA) */}
                <TabsContent value="directory" className="space-y-6">
                    {/* Filter di Atas */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="w-full sm:w-auto">
                                    <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Filter Kelas</Label>
                                    <DropdownMenu open={isRombelFilterOpen} onOpenChange={(open) => {
                                        if (open) {
                                            setTempFilterAbjad(filterAbjad);
                                            setRombelSearchQuery("");
                                            setIsRombelFilterOpen(true);
                                        } else {
                                            setIsRombelFilterOpen(false);
                                        }
                                    }}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-9 w-full sm:w-48 bg-white flex items-center justify-between border-slate-200">
                                                <span className="flex items-center gap-2 text-slate-700">
                                                    <Filter className="w-3.5 h-3.5" />
                                                    {filterTingkat === 'all' ? 'Semua Kelas' : `Kelas ${filterTingkat}`}
                                                </span>
                                                {filterAbjad.length > 0 && filterAbjad.length < 6 && (
                                                    <Badge variant="secondary" className="ml-2 bg-[#000080]/10 text-[#000080] rounded-sm px-1 font-bold text-[10px]">
                                                        {filterAbjad.length}
                                                    </Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[240px] p-2 bg-white flex flex-col gap-2 shadow-xl border-slate-200 z-[100]">
                                            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-md mb-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFilterTingkat('all');
                                                    }}
                                                    className={`text-[10px] py-1 rounded-sm font-bold transition-all ${filterTingkat === 'all' ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    All
                                                </button>
                                                {availableTingkats.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFilterTingkat(t);
                                                        }}
                                                        className={`text-[10px] py-1 rounded-sm font-bold transition-all ${filterTingkat === t ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <Search className="w-3 h-3 absolute left-2 top-1.5 text-slate-400" />
                                                <input
                                                    value={rombelSearchQuery}
                                                    onChange={e => setRombelSearchQuery(e.target.value)}
                                                    placeholder="Cari..."
                                                    className="w-full h-6 pl-7 pr-2 text-xs border border-slate-200 focus:outline-none focus:border-[#000080] rounded-sm"
                                                />
                                            </div>
                                            <div className="border border-slate-200 max-h-48 overflow-y-auto py-1 rounded-sm">
                                                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 cursor-pointer text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        className="w-3.5 h-3.5 accent-[#000080] shrink-0"
                                                        checked={tempFilterAbjad.length === 6}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setTempFilterAbjad(["A", "B", "C", "D", "E", "F"]);
                                                            else setTempFilterAbjad([]);
                                                        }}
                                                    />
                                                    <span className="text-[11px] font-bold leading-none">(Select All)</span>
                                                </label>

                                                <div className="relative mt-1">
                                                    <div className="absolute left-[13px] top-0 bottom-[10px] w-px border-l border-dotted border-slate-400 pointer-events-none z-0"></div>
                                                    {availableAbjads
                                                        .filter(char => char.toLowerCase().includes(rombelSearchQuery.toLowerCase()))
                                                        .map((char) => (
                                                            <label key={char} className="relative flex items-center gap-2 pl-[25px] pr-2 py-1 hover:bg-slate-50 cursor-pointer text-slate-700 group">
                                                                <div className="absolute left-[13px] top-1/2 w-2 border-t border-dotted border-slate-400 pointer-events-none z-0"></div>
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-3.5 h-3.5 accent-[#000080] shrink-0 relative z-10"
                                                                    checked={tempFilterAbjad.includes(char)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setTempFilterAbjad([...tempFilterAbjad, char]);
                                                                        else setTempFilterAbjad(tempFilterAbjad.filter(c => c !== char));
                                                                    }}
                                                                />
                                                                <span className="text-[11px] leading-none text-slate-600 font-medium">Kelas {filterTingkat === 'all' ? char : filterTingkat + " " + char}</span>
                                                            </label>
                                                        ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-1.5 pt-1 mt-1 border-t border-slate-100">
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 py-0 rounded-sm bg-white" onClick={() => setIsRombelFilterOpen(false)}>Cancel</Button>
                                                <Button size="sm" className="h-7 text-[10px] px-3 py-0 font-bold rounded-sm bg-[#000080] text-white hover:bg-blue-900" onClick={() => {
                                                    setFilterAbjad(tempFilterAbjad);
                                                    setIsRombelFilterOpen(false);
                                                }}>OK</Button>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center w-full md:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari Nama / NISN..." className="pl-9 bg-white border-slate-200 h-9" />
                                </div>
                                <div className="text-sm text-slate-500 italic whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    Total: <b className="text-slate-700">{filteredSiswa.length}</b> Siswa Aktif
                                </div>
                                {selectedSiswaIds.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold"
                                        onClick={handleBatchDeleteSiswa}
                                        disabled={isBatchDeletingSiswa}
                                    >
                                        {isBatchDeletingSiswa ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                        Hapus {selectedSiswaIds.length} Terpilih
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table di Bawah (Penuh) */}
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={isAllFilteredSiswaSelected ? true : selectedFilteredSiswaIds.length > 0 ? "indeterminate" : false}
                                                onCheckedChange={(checked) => toggleSelectAllFilteredSiswa(checked === true)}
                                                aria-label="Pilih semua siswa yang tampil"
                                            />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">No induk</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Nama Siswa</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">JK</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Tanggal Lahir</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Kota</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Alamat</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Nama Ayah</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Pekerjaan</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Nama Ibu</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">Pekerjaan</TableHead>
                                        <TableHead className="font-bold text-[#000080] whitespace-nowrap">No Telp</TableHead>
                                        <TableHead className="font-bold text-[#000080] text-right whitespace-nowrap">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSiswa.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedSiswaIds.includes(s.id)}
                                                    onCheckedChange={(checked) => toggleSelectSiswa(s.id, checked === true)}
                                                    aria-label={`Pilih siswa ${s.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-700">{s.noInduk}</TableCell>
                                            <TableCell className="font-bold text-slate-800 whitespace-nowrap">{s.name}</TableCell>
                                            <TableCell className="text-slate-600">
                                                <Badge variant="outline" className={s.gender === 'L' ? "text-blue-600 border-blue-200" : "text-pink-600 border-pink-200"}>
                                                    {s.gender || 'L'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.tglLahir}</TableCell>
                                            <TableCell className="text-slate-600">{s.kota}</TableCell>
                                            <TableCell className="text-slate-600 max-w-[200px] truncate" title={s.alamat}>{s.alamat}</TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.namaAyah}</TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.pekerjaanAyah}</TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.namaIbu}</TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.pekerjaanIbu}</TableCell>
                                            <TableCell className="text-slate-600 whitespace-nowrap">{s.wa}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700" title="Lihat Profil" onClick={() => setDetailSiswa(s)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                        {/* Detail Siswa Modal */}
                        <Dialog open={!!detailSiswa} onOpenChange={(open) => !open && setDetailSiswa(null)}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <div className="flex items-center justify-between mr-6">
                                        <div>
                                            <DialogTitle>Profil Siswa</DialogTitle>
                                            <DialogDescription>Informasi lengkap mengenai {detailSiswa?.name}</DialogDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100" onClick={() => handleDeleteSiswa(detailSiswa.id, detailSiswa.name)}>
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                Hapus
                                            </Button>
                                            <Button variant="outline" size="sm" className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" onClick={() => { handleEditSiswaClick(detailSiswa); setDetailSiswa(null); }}>
                                                <Edit2 className="w-3.5 h-3.5 mr-2" />
                                                Edit Profil
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>
                                {detailSiswa && (
                                    <div className="py-4">
                                        <div className="flex items-center gap-6 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-black text-[#000080]">{detailSiswa.name}</h2>
                                                <p className="text-sm text-slate-500 font-mono mt-1">NISN: {detailSiswa.nisn}</p>
                                                <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none mr-2">Kelas {detailSiswa.cls}</Badge>
                                                <Badge variant="outline" className={detailSiswa.gender === 'L' ? "mt-2 text-blue-600 border-blue-200" : "mt-2 text-pink-600 border-pink-200"}>
                                                    {detailSiswa.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Wali Murid</p>
                                                <p className="text-sm font-medium text-slate-800 mt-1">{detailSiswa.parent}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Nomor Kontak</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-medium text-slate-800">{detailSiswa.wa !== "-" ? `+${detailSiswa.wa}` : 'Belum Ditambahkan'}</p>
                                                    {detailSiswa.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4" /> Informasi Lengkap Siswa</h3>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. Induk / NISN</p>
                                                        <p className="text-sm font-medium text-slate-800">{detailSiswa.noInduk} / {detailSiswa.nisn}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempat / Tgl Lahir</p>
                                                        <p className="text-sm font-medium text-slate-800">{detailSiswa.kota}, {detailSiswa.tglLahir}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</p>
                                                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{detailSiswa.alamat}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 border-l md:pl-4 border-slate-200">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Ayah</p>
                                                        <p className="text-sm font-medium text-slate-800">{detailSiswa.namaAyah}</p>
                                                        <Badge variant="outline" className="text-[10px] mt-1 bg-white">{detailSiswa.pekerjaanAyah}</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Ibu</p>
                                                        <p className="text-sm font-medium text-slate-800">{detailSiswa.namaIbu}</p>
                                                        <Badge variant="outline" className="text-[10px] mt-1 bg-white">{detailSiswa.pekerjaanIbu}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Edit Siswa Modal */}
                        <Dialog open={!!editSiswa} onOpenChange={(open) => !open && setEditSiswa(null)}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Edit Data Siswa</DialogTitle>
                                    <DialogDescription>Perbarui informasi identitas siswa dan wali murid.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold text-[#000080]">Identitas Dasar</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_nisn">NISN</Label>
                                                <Input id="edit_nisn" value={editSiswaNisn} onChange={e => setEditSiswaNisn(e.target.value)} disabled className="bg-slate-50 cursor-not-allowed" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_nama">Nama Lengkap</Label>
                                                <Input id="edit_nama" value={editSiswaNama} onChange={e => setEditSiswaNama(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_kelas">Kelas</Label>
                                                <Select value={editSiswaKelas} onValueChange={setEditSiswaKelas}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="VII A">VII A</SelectItem>
                                                        <SelectItem value="VII B">VII B</SelectItem>
                                                        <SelectItem value="VIII A">VIII A</SelectItem>
                                                        <SelectItem value="VIII B">VIII B</SelectItem>
                                                        <SelectItem value="IX A">IX A</SelectItem>
                                                        <SelectItem value="IX B">IX B</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_gender">Jenis Kelamin</Label>
                                                <Select value={editSiswaGender} onValueChange={setEditSiswaGender}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="L">Laki-laki</SelectItem>
                                                        <SelectItem value="P">Perempuan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-sm font-bold text-[#000080]">Asal & Tanggal Lahir</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_kota">Kota Lahir</Label>
                                                <Input id="edit_kota" value={editKota} onChange={e => setEditKota(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_tgl">Tanggal Lahir</Label>
                                                <Input id="edit_tgl" type="date" value={editTglLahir} onChange={e => setEditTglLahir(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_alamat">Alamat Lengkap</Label>
                                            <Input id="edit_alamat" value={editAlamat} onChange={e => setEditAlamat(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-sm font-bold text-[#000080]">Data Orang Tua / Wali</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ayah">Nama Ayah</Label>
                                                <Input id="edit_ayah" value={editNamaAyah} onChange={e => setEditNamaAyah(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_p_ayah">Pekerjaan Ayah</Label>
                                                <Input id="edit_p_ayah" value={editPekerjaanAyah} onChange={e => setEditPekerjaanAyah(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ibu">Nama Ibu</Label>
                                                <Input id="edit_ibu" value={editNamaIbu} onChange={e => setEditNamaIbu(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_p_ibu">Pekerjaan Ibu</Label>
                                                <Input id="edit_p_ibu" value={editPekerjaanIbu} onChange={e => setEditPekerjaanIbu(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ortu">Link Akun Orang Tua</Label>
                                                <Select value={editNikOrtu} onValueChange={applyOrtuToEditForm}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih Wali" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="-">Belum ada Akun</SelectItem>
                                                        {ortuList.map(o => (
                                                            <SelectItem key={o.nik} value={o.nik}>{o.name} ({o.nik})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ortu_nama">Nama Wali (Display)</Label>
                                                <Input id="edit_ortu_nama" value={editOrtuNama} onChange={e => setEditOrtuNama(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit_ortu_wa">No. Telepon (WA)</Label>
                                                <Input id="edit_ortu_wa" value={editOrtuWa} onChange={e => setEditOrtuWa(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditSiswa(null)}>Batal</Button>
                                    <Button className="bg-[#000080] text-white" onClick={handleSaveEditSiswa} disabled={isEditSaving}>
                                        {isEditSaving ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                </TabsContent>

                {/* TAB 2: LOG & MONITORING */}
                <TabsContent value="monitoring" className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                        <History className="w-5 h-5" />
                                        Log Kehadiran Individual
                                    </CardTitle>
                                    <CardDescription>Pantau riwayat kehadiran siswa secara detail.</CardDescription>
                                </div>
                                <div className="flex flex-row gap-2 w-full md:w-auto">
                                    <Input placeholder="Cari Siswa..." className="w-full md:w-64 bg-white" />
                                    <Button variant="outline"><Filter className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Siswa</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Keterangan / Mapel</TableHead>
                                        <TableHead className="text-right">Bukti</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monitoringLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                                {presensiLoading || izinLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Belum ada riwayat aktivitas."}
                                            </TableCell>
                                        </TableRow>
                                    ) : monitoringLogs.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                                                {new Date(log.rawTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-700">{log.name}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    log.type === 'H' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" :
                                                    log.type === 'S' || log.type === 'I' ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" :
                                                    "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 max-w-[300px] truncate" title={log.ket}>{log.ket}</TableCell>
                                            <TableCell className="text-right">
                                                {log.attachment && (
                                                    <Button variant="link" className="text-blue-600 h-auto p-0 text-xs font-bold" onClick={() => window.open(log.attachment, '_blank')}>Lihat Bukti</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: DISPENSASI */}
                <TabsContent value="dispensation" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-purple-50 border-b border-purple-100">
                                <CardTitle className="text-purple-900 text-base font-bold">Input Dispensasi</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Filter Kelas</Label>
                                        <Select value={dispSelectedKelas} onValueChange={(val) => {
                                            setDispSelectedKelas(val);
                                            setDispSelectedSiswaId("");
                                            setDispSiswaName("");
                                        }}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Pilih Kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kelasList.map(k => (
                                                    <SelectItem key={k.id} value={k.name}>{k.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pilih Siswa</Label>
                                        <Select 
                                            value={dispSelectedSiswaId} 
                                            onValueChange={(val) => {
                                                setDispSelectedSiswaId(val);
                                                const s = siswaData.find(siswa => siswa.id.toString() === val);
                                                if (s) setDispSiswaName(s.name);
                                            }}
                                            disabled={!dispSelectedKelas}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder={!dispSelectedKelas ? "Pilih Kelas Dulu" : "Pilih Nama"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredSiswaForDisp.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Keperluan</Label>
                                    <Input placeholder="Contoh: Lomba Olahraga, Acara Keluarga..." value={dispKeperluan} onChange={e => setDispKeperluan(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rentang Tanggal</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={dispStartDate} onChange={e => setDispStartDate(e.target.value)} />
                                        <Input type="date" value={dispEndDate} onChange={e => setDispEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Upload Bukti (Opsional)</Label>
                                    <Input type="file" className="bg-white text-xs" onChange={e => setDispProofFile(e.target.files?.[0] || null)} />
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={handleMakeSurat}>
                                    Buat Surat Dispensasi
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-slate-200 bg-white shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <CardTitle className="text-[#000080] text-base font-bold">Riwayat & Monitoring Dispensasi</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                            <Input 
                                                placeholder="Cari siswa..." 
                                                className="h-8 pl-8 text-xs w-40 bg-white"
                                                value={dispSearchQuery}
                                                onChange={e => setDispSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <Select value={dispFilterStatus} onValueChange={setDispFilterStatus}>
                                            <SelectTrigger className="h-8 text-xs w-32 bg-white">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Semua</SelectItem>
                                                <SelectItem value="APPROVED">Disetujui</SelectItem>
                                                <SelectItem value="PENDING">Menunggu</SelectItem>
                                                <SelectItem value="REJECTED">Ditolak</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[500px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-50 z-10">
                                            <TableRow>
                                                <TableHead className="text-[11px] font-bold uppercase">Siswa</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase">Keperluan</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase">Tanggal</TableHead>
                                                <TableHead className="text-[11px] font-bold uppercase text-right">Status / Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDispHistory.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic font-medium">
                                                        Tidak ada data dispensasi yang ditemukan.
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredDispHistory.map((item: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="py-3">
                                                        <p className="font-bold text-slate-800 text-sm">{item.student_name}</p>
                                                        <p className="text-[10px] text-slate-500">ID: {item.student_id}</p>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <p className="text-xs font-medium text-purple-700 leading-tight line-clamp-2" title={item.reason}>
                                                            {item.reason}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <p className="text-[10px] font-mono text-slate-600">
                                                            {new Date(item.start_date).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })} 
                                                            {item.start_date !== item.end_date && ` - ${new Date(item.end_date).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}`}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right py-3">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <Badge className={`text-[9px] px-1.5 py-0 rounded-full border-none shadow-none ${
                                                                item.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : 
                                                                item.status === 'PENDING' ? "bg-amber-100 text-amber-700" : 
                                                                "bg-red-100 text-red-700"
                                                            }`}>
                                                                {item.status}
                                                            </Badge>
                                                            {item.attachment_url && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    className="h-7 px-2 text-[10px] font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                                                                    onClick={() => setSelectedProofUrl(item.attachment_url)}
                                                                >
                                                                    <Eye className="w-3 h-3 mr-1" /> Lihat Bukti
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Proof Preview Modal */}
                        <Dialog open={!!selectedProofUrl} onOpenChange={(open) => !open && setSelectedProofUrl(null)}>
                            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                                <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10">
                                    <DialogTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        Lampiran Bukti Dispensasi
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="bg-slate-50 p-6 flex justify-center items-center min-h-[300px]">
                                    {selectedProofUrl === "OFFICIAL_LETTER" ? (
                                        <div className="text-center p-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
                                            <FileText className="w-16 h-16 text-blue-100 mx-auto mb-4" />
                                            <h3 className="font-bold text-slate-700">Surat Resmi Sistem</h3>
                                            <p className="text-xs text-slate-500 mt-2">Dispensasi ini diterbitkan secara resmi melalui sistem oleh Admin. Bukti fisik adalah Surat Dispensasi yang dicetak saat pembuatan.</p>
                                        </div>
                                    ) : selectedProofUrl && (
                                        <img 
                                            src={getUploadUrl(selectedProofUrl)} 
                                            alt="Bukti Lampiran" 
                                            className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-white"
                                            onError={(e: any) => {
                                                e.target.src = "https://placehold.co/400x600?text=Bukti+Tidak+Ditemukan";
                                            }}
                                        />
                                    )}
                                </div>
                                <DialogFooter className="p-3 bg-white border-t">
                                    <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => setSelectedProofUrl(null)}>Tutup Preview</Button>
                                    {selectedProofUrl && selectedProofUrl !== "OFFICIAL_LETTER" && (
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="text-xs font-bold bg-[#000080]"
                                            onClick={() => window.open(getUploadUrl(selectedProofUrl), '_blank')}
                                        >
                                            Buka di Tab Baru
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Surat Preview Modal */}
                        <Dialog open={!!previewSurat} onOpenChange={(open) => !open && setPreviewSurat(null)}>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader className="print:hidden">
                                    <DialogTitle>Preview Surat Dispensasi</DialogTitle>
                                    <DialogDescription>Periksa kembali isi surat sebelum mencetak dan menyimpan ke database.</DialogDescription>
                                </DialogHeader>
                                {previewSurat && (
                                    <div className="bg-white p-8 border border-slate-200 mt-2 text-slate-800">
                                        <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                                            <h2 className="text-2xl font-black uppercase">Surat Izin Dispensasi Sekolah</h2>
                                            <p className="text-sm mt-1">Sistem Presensi SIPANDU • SMPK Santa Maria 2</p>
                                        </div>
                                        <div className="space-y-4 leading-relaxed">
                                            <p>Yang bertanda tangan di bawah ini, Kepala Admin Sekolah menerangkan bahwa:</p>
                                            <table className="w-full text-left font-medium ml-4">
                                                <tbody>
                                                    <tr><td className="w-32 py-1">Nama Siswa</td><td>: <strong>{previewSurat.name}</strong></td></tr>
                                                    <tr><td className="w-32 py-1">Catatan Kelas</td><td>: {previewSurat.cls}</td></tr>
                                                    <tr><td className="w-32 py-1">Keperluan</td><td>: <strong>{previewSurat.reason}</strong></td></tr>
                                                    <tr><td className="w-32 py-1">Tanggal Berlaku</td><td>: <strong>{previewSurat.date}</strong></td></tr>
                                                </tbody>
                                            </table>
                                            <p className="pt-2">Demikian surat dispensasi ini diberikan agar dapat dipergunakan sebagaimana mestinya dan dicatat secara sah di dalam sistem kehadiran. Mohon kebijaksanaan dari tenaga pendidik setempat atas absensi ananda pada tanggal tersebut.</p>
                                            <div className="mt-12 text-right">
                                                <p>Dikeluarkan pada: {new Date().toLocaleDateString('id-ID')}</p>
                                                <p className="font-bold mt-16 underline">Admin / Tata Usaha</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter className="print:hidden mt-4">
                                    <Button variant="outline" onClick={() => setPreviewSurat(null)}>Batal</Button>
                                    <Button className="bg-purple-700 text-white" onClick={handlePrintSurat}>
                                        <FileText className="w-4 h-4 mr-2" /> Simpan & Unduh Surat (PDF)
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>


            </Tabs>
        </div>
    );
}
