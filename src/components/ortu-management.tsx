"use client";

import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    ShieldCheck,
    KeyRound,
    Smartphone,
    Mail,
    Upload,
    FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
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
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/api-config";

interface Ortu {
    id: number;
    nik: string;
    name: string;
    email: string;
    phone: string;
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
    status: string;
}

interface ImportOrtuRow {
    nik: string;
    name: string;
    namaAyah: string;
    pekerjaanAyah: string;
    namaIbu: string;
    pekerjaanIbu: string;
    email: string;
    phone: string;
    password: string;
    status: string;
}

interface OrtuManagementProps {
    mode: "master" | "account";
}

const IMPORT_HEADERS = ["nik", "name", "namaAyah", "pekerjaanAyah", "namaIbu", "pekerjaanIbu", "email", "phone"];

const sanitizeNik = (value: string) => value.replace(/\D/g, "");

const normalizeHeader = (header: string) =>
    header
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "");

const getCellValue = (row: Record<string, unknown>, aliases: string[]) => {
    for (const alias of aliases) {
        const value = row[alias];
        if (value !== undefined && value !== null) return String(value).trim();
    }
    return "";
};

const normalizeNikImport = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^\d+(\.0+)?$/.test(trimmed)) {
        return trimmed.replace(/\.0+$/, "");
    }

    const scientific = trimmed.match(/^(\d+(?:\.\d+)?)e\+?(\d+)$/i);
    if (scientific) {
        const digits = scientific[1].replace(".", "");
        const decimals = (scientific[1].split(".")[1] || "").length;
        const zeroCount = Number(scientific[2]) - decimals;
        if (zeroCount >= 0) return `${digits}${"0".repeat(zeroCount)}`;
    }

    return sanitizeNik(trimmed);
};

export function OrtuManagement({ mode }: OrtuManagementProps) {
    const isAccountMode = mode === "account";
    const [ortuList, setOrtuList] = useState<Ortu[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedOrtuIds, setSelectedOrtuIds] = useState<number[]>([]);
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const converterInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        nik: "",
        name: "",
        namaAyah: "",
        pekerjaanAyah: "",
        namaIbu: "",
        pekerjaanIbu: "",
        email: "",
        phone: "",
        password: "password123",
        status: "AKTIF"
    });

    const fetchOrtu = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/ortu/index.php`);
            const data = await res.json();
            if (data.status === "success") {
                setOrtuList(data.data);
            }
        } catch (error) {
            toast.error("Gagal mengambil data Orang Tua");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrtu();
    }, []);

    const normalizeImportRow = (row: Record<string, unknown>): ImportOrtuRow => {
        const normalized = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
        );

        return {
            nik: normalizeNikImport(getCellValue(normalized, ["nik", "no_nik", "nomor_induk_kependudukan", "username"])),
            name: getCellValue(normalized, ["name", "nama", "nama_lengkap", "nama_orang_tua", "nama_wali", "nama_wali_display", "wali"]),
            namaAyah: getCellValue(normalized, ["namaayah", "nama_ayah", "ayah"]),
            pekerjaanAyah: getCellValue(normalized, ["pekerjaanayah", "pekerjaan_ayah", "kerja_ayah"]),
            namaIbu: getCellValue(normalized, ["namaibu", "nama_ibu", "ibu"]),
            pekerjaanIbu: getCellValue(normalized, ["pekerjaanibu", "pekerjaan_ibu", "kerja_ibu"]),
            email: getCellValue(normalized, ["email", "email_orang_tua"]),
            phone: getCellValue(normalized, ["phone", "no_whatsapp", "nowhatsapp", "wa", "whatsapp", "no_wa"]),
            password: "password123",
            status: "AKTIF",
        };
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
            const headerIndex = rawRows.findIndex((row) => {
                const normalizedHeaders = row.map((cell) => normalizeHeader(String(cell)));
                return normalizedHeaders.includes("nik") && (normalizedHeaders.includes("name") || normalizedHeaders.includes("nama"));
            });

            if (headerIndex === -1) {
                toast.error("Header import tidak ditemukan. Pastikan ada kolom nik dan name/nama.");
                return;
            }

            const headers = rawRows[headerIndex].map((cell) => String(cell).trim());
            const rows = rawRows.slice(headerIndex + 1)
                .filter((row) => row.some((cell) => String(cell).trim() !== ""))
                .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));

            if (rows.length === 0) {
                toast.error("File import kosong");
                return;
            }

            const seenNik = new Set<string>();
            const existingNik = new Set(ortuList.map((ortu) => ortu.nik));
            const validRows: ImportOrtuRow[] = [];
            let missingNik = 0;
            let missingName = 0;
            let invalidNik = 0;
            let duplicateNik = 0;

            for (const row of rows) {
                const data = normalizeImportRow(row);
                if (!data.nik) {
                    missingNik++;
                    continue;
                }
                if (!data.name) {
                    missingName++;
                    continue;
                }
                if (!/^\d+$/.test(data.nik)) {
                    invalidNik++;
                    continue;
                }
                if (seenNik.has(data.nik) || existingNik.has(data.nik)) {
                    duplicateNik++;
                    continue;
                }

                seenNik.add(data.nik);
                validRows.push(data);
            }

            if (validRows.length === 0) {
                toast.error(`Tidak ada baris valid. Kosong NIK: ${missingNik}, kosong nama: ${missingName}, NIK salah: ${invalidNik}, duplikat: ${duplicateNik}.`);
                return;
            }

            let success = 0;
            let failed = 0;
            for (const row of validRows) {
                const res = await fetch(`${getApiBaseUrl()}/ortu/index.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(row),
                });
                const data = await res.json();
                if (data.status === "success") {
                    success++;
                } else {
                    failed++;
                }
            }

            const skipped = missingNik + missingName + invalidNik + duplicateNik;
            toast.success(`Import selesai: ${success} berhasil, ${failed} gagal, ${skipped} dilewati.`);
            fetchOrtu();
        } catch (error) {
            toast.error("Gagal membaca file. Gunakan CSV, XLS, atau XLSX dengan header yang sesuai.");
        } finally {
            setImporting(false);
            event.target.value = "";
        }
    };

    const handleConvertExcelToCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const baseName = file.name.replace(/\.(xlsx|xls)$/i, "");

            link.href = url;
            link.download = `${baseName || "data_ortu"}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Sheet "${sheetName}" berhasil dikonversi ke CSV.`);
        } catch (error) {
            toast.error("Gagal mengonversi Excel. Pastikan file berformat XLS atau XLSX.");
        } finally {
            event.target.value = "";
        }
    };

    const downloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            {
                nik: "1234567890123456",
                name: "Nama Wali Display",
                namaAyah: "Nama Ayah",
                pekerjaanAyah: "Karyawan",
                namaIbu: "Nama Ibu",
                pekerjaanIbu: "Ibu Rumah Tangga",
                email: "ortu@example.com",
                phone: "081234567890",
            },
        ], { header: IMPORT_HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "template_ortu");
        XLSX.writeFile(workbook, "template_import_ortu.xlsx");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d+$/.test(formData.nik)) {
            toast.error("NIK hanya boleh berisi angka");
            return;
        }

        const method = editMode || isAccountMode ? "PUT" : "POST";
        const url = method === "PUT"
            ? `${getApiBaseUrl()}/ortu/index.php?id=${selectedId}`
            : `${getApiBaseUrl()}/ortu/index.php`;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.status === "success") {
                toast.success(isAccountMode ? "Akun orang tua berhasil diperbarui" : data.message);
                setIsDialogOpen(false);
                fetchOrtu();
                resetForm();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus akun Orang Tua ini? Data hubungan siswa akan tetap ada di tabel siswa.")) return;
        try {
            const res = await fetch(`${getApiBaseUrl()}/ortu/index.php?id=${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.status === "success") {
                toast.success("Berhasil dihapus");
                fetchOrtu();
            }
        } catch (error) {
            toast.error("Gagal menghapus data");
        }
    };

    const handleBatchDelete = async () => {
        if (selectedOrtuIds.length === 0 || isBatchDeleting) return;
        if (!confirm(`Hapus ${selectedOrtuIds.length} data orang tua terpilih? Data hubungan siswa akan tetap ada di tabel siswa.`)) return;

        setIsBatchDeleting(true);
        try {
            const results = await Promise.allSettled(
                selectedOrtuIds.map((id) =>
                    fetch(`${getApiBaseUrl()}/ortu/index.php?id=${id}`, { method: "DELETE" })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.status !== "success") throw new Error(data.message || "Gagal menghapus orang tua");
                            return data;
                        })
                )
            );
            const successCount = results.filter((result) => result.status === "fulfilled").length;
            const failedCount = selectedOrtuIds.length - successCount;

            if (successCount > 0) toast.success(`${successCount} data orang tua berhasil dihapus.`);
            if (failedCount > 0) toast.error(`${failedCount} data orang tua gagal dihapus.`);

            setSelectedOrtuIds([]);
            fetchOrtu();
        } catch (error) {
            toast.error("Gagal menghapus data orang tua terpilih.");
        } finally {
            setIsBatchDeleting(false);
        }
    };

    const resetForm = () => {
        setFormData({ nik: "", name: "", namaAyah: "", pekerjaanAyah: "", namaIbu: "", pekerjaanIbu: "", email: "", phone: "", password: "password123", status: "AKTIF" });
        setEditMode(false);
        setSelectedId(null);
    };

    const openFromOrtu = (ortu: Ortu, accountProvision = false) => {
        setFormData({
            nik: ortu.nik,
            name: ortu.name,
            namaAyah: ortu.namaAyah || "",
            pekerjaanAyah: ortu.pekerjaanAyah || "",
            namaIbu: ortu.namaIbu || "",
            pekerjaanIbu: ortu.pekerjaanIbu || "",
            email: ortu.email || "",
            phone: ortu.phone || "",
            password: accountProvision ? "password123" : "",
            status: ortu.status || "AKTIF"
        });
        setSelectedId(ortu.id);
        setEditMode(!accountProvision);
        setIsDialogOpen(true);
    };

    const filtered = ortuList.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.nik.includes(search) ||
        (o.email || "").toLowerCase().includes(search.toLowerCase())
    );
    const filteredOrtuIds = filtered.map((ortu) => ortu.id);
    const selectedFilteredOrtuIds = selectedOrtuIds.filter((id) => filteredOrtuIds.includes(id));
    const isAllFilteredOrtuSelected = filtered.length > 0 && selectedFilteredOrtuIds.length === filtered.length;

    const toggleSelectAllFilteredOrtu = (checked: boolean) => {
        setSelectedOrtuIds((current) => {
            const next = new Set(current);
            if (checked) {
                filteredOrtuIds.forEach((id) => next.add(id));
            } else {
                filteredOrtuIds.forEach((id) => next.delete(id));
            }
            return Array.from(next);
        });
    };

    const toggleSelectOrtu = (id: number, checked: boolean) => {
        setSelectedOrtuIds((current) =>
            checked ? Array.from(new Set([...current, id])) : current.filter((selectedId) => selectedId !== id)
        );
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#000080] tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        {isAccountMode ? "Pendaftaran Akun Orang Tua" : "Manajemen Data Orang Tua"}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isAccountMode
                            ? "Aktifkan kredensial portal dari data orang tua yang sudah dibuat TU."
                            : "Kelola data lengkap orang tua/wali untuk relasi data siswa."}
                    </p>
                </div>

                {!isAccountMode && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#000080] hover:bg-blue-900 font-bold h-12 shadow-md rounded-xl">
                                <Plus className="w-5 h-5 mr-2" />
                                Tambah Data Ortu
                            </Button>
                        </DialogTrigger>
                        <OrtuDialogContent
                            editMode={editMode}
                            isAccountMode={false}
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                        />
                    </Dialog>
                )}
            </div>

            {!isAccountMode && (
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <p className="font-black text-slate-800 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-[#000080]" />
                                Import Data Orang Tua
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Format kolom: nik, name, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, email, phone.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" className="font-bold rounded-xl" onClick={downloadTemplate}>
                                Download Template
                            </Button>
                            <input
                                ref={converterInputRef}
                                type="file"
                                accept=".xls,.xlsx"
                                className="hidden"
                                onChange={handleConvertExcelToCsv}
                            />
                            <Button
                                variant="outline"
                                className="font-bold rounded-xl"
                                onClick={() => converterInputRef.current?.click()}
                            >
                                Convert Excel ke CSV
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                className="hidden"
                                onChange={handleImportFile}
                            />
                            <Button
                                className="bg-[#000080] hover:bg-blue-900 font-bold rounded-xl"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                            >
                                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                {importing ? "Mengimpor..." : "Import CSV/Excel"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isAccountMode && (
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                    <OrtuDialogContent
                        editMode={false}
                        isAccountMode
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                    />
                </Dialog>
            )}

            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                className="bg-white pl-10 h-11 border-slate-200 focus:ring-blue-500/20 rounded-xl"
                                placeholder="Cari berdasarkan Nama, NIK, atau Email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {!isAccountMode && selectedOrtuIds.length > 0 && (
                            <Button
                                variant="outline"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold rounded-xl"
                                onClick={handleBatchDelete}
                                disabled={isBatchDeleting}
                            >
                                {isBatchDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Hapus {selectedOrtuIds.length} Terpilih
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#000080]" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Data Server...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                                    <tr>
                                        {!isAccountMode && (
                                            <th className="px-8 py-4 w-12">
                                                <Checkbox
                                                    checked={isAllFilteredOrtuSelected ? true : selectedFilteredOrtuIds.length > 0 ? "indeterminate" : false}
                                                    onCheckedChange={(checked) => toggleSelectAllFilteredOrtu(checked === true)}
                                                    aria-label="Pilih semua orang tua yang tampil"
                                                />
                                            </th>
                                        )}
                                        <th className="px-8 py-4">Data Identitas</th>
                                        <th className="px-6 py-4">Kontak</th>
                                        <th className="px-6 py-4">Status Akun</th>
                                        <th className="px-8 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map((ortu) => (
                                        <tr key={ortu.id} className="hover:bg-slate-50 transition-colors group">
                                            {!isAccountMode && (
                                                <td className="px-8 py-6">
                                                    <Checkbox
                                                        checked={selectedOrtuIds.includes(ortu.id)}
                                                        onCheckedChange={(checked) => toggleSelectOrtu(ortu.id, checked === true)}
                                                        aria-label={`Pilih orang tua ${ortu.name}`}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                        <Users className="w-6 h-6 text-[#000080]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-lg leading-tight">{ortu.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge className="bg-slate-100 text-slate-500 border-none font-mono text-[10px]">NIK: {ortu.nik}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        {ortu.email || "-"}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                                                        {ortu.phone || "-"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${ortu.status === "AKTIF" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-red-500"}`} />
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{ortu.status}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant={isAccountMode ? "default" : "ghost"}
                                                        size={isAccountMode ? "sm" : "icon"}
                                                        className={isAccountMode ? "bg-[#000080] hover:bg-blue-900 rounded-xl font-bold" : "hover:bg-blue-50 hover:text-blue-600 rounded-xl"}
                                                        onClick={() => openFromOrtu(ortu, isAccountMode)}
                                                    >
                                                        {isAccountMode ? (
                                                            <>
                                                                <KeyRound className="w-4 h-4 mr-2" />
                                                                Buat / Update Akun
                                                            </>
                                                        ) : (
                                                            <Edit2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    {!isAccountMode && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                                                            onClick={() => handleDelete(ortu.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={isAccountMode ? 4 : 5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2 grayscale group-hover:grayscale-0 transition-all opacity-40">
                                                    <Users className="w-16 h-16 text-slate-300" />
                                                    <p className="font-bold text-slate-400">Tidak ada data Orang Tua yang cocok</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function OrtuDialogContent({
    editMode,
    isAccountMode,
    formData,
    setFormData,
    onSubmit,
}: {
    editMode: boolean;
    isAccountMode: boolean;
    formData: {
        nik: string;
        name: string;
        namaAyah: string;
        pekerjaanAyah: string;
        namaIbu: string;
        pekerjaanIbu: string;
        email: string;
        phone: string;
        password: string;
        status: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <DialogContent className="max-w-md bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="bg-blue-50 px-8 py-6">
                <DialogTitle className="text-2xl font-black text-[#000080]">
                    {isAccountMode ? "Buat / Update Akun Orang Tua" : editMode ? "Edit Data Orang Tua" : "Tambah Data Orang Tua"}
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="p-8 space-y-5">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">NIK (Username)</Label>
                    <Input
                        className="h-11 bg-slate-50 border-slate-200"
                        placeholder="Contoh: 1234567890..."
                        value={formData.nik}
                        onChange={e => setFormData((prev: any) => ({...prev, nik: sanitizeNik(e.target.value)}))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        readOnly={isAccountMode}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Wali (Display)</Label>
                    <Input
                        className="h-11 bg-slate-50 border-slate-200"
                        value={formData.name}
                        onChange={e => setFormData((prev: any) => ({...prev, name: e.target.value}))}
                        readOnly={isAccountMode}
                        required
                    />
                </div>
                {!isAccountMode && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Ayah</Label>
                                <Input className="h-11 bg-slate-50 border-slate-200" value={formData.namaAyah} onChange={e => setFormData((prev: any) => ({...prev, namaAyah: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pekerjaan Ayah</Label>
                                <Input className="h-11 bg-slate-50 border-slate-200" value={formData.pekerjaanAyah} onChange={e => setFormData((prev: any) => ({...prev, pekerjaanAyah: e.target.value}))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Ibu</Label>
                                <Input className="h-11 bg-slate-50 border-slate-200" value={formData.namaIbu} onChange={e => setFormData((prev: any) => ({...prev, namaIbu: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pekerjaan Ibu</Label>
                                <Input className="h-11 bg-slate-50 border-slate-200" value={formData.pekerjaanIbu} onChange={e => setFormData((prev: any) => ({...prev, pekerjaanIbu: e.target.value}))} />
                            </div>
                        </div>
                    </>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</Label>
                        <Input type="email" className="h-11 bg-slate-50 border-slate-200" value={formData.email} onChange={e => setFormData((prev: any) => ({...prev, email: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">No. WhatsApp</Label>
                        <Input className="h-11 bg-slate-50 border-slate-200" value={formData.phone} onChange={e => setFormData((prev: any) => ({...prev, phone: e.target.value}))} />
                    </div>
                </div>
                {(isAccountMode || !editMode) && (
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-blue-600">Password Awal</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                className="h-11 bg-blue-50 border-blue-100 pl-10 font-mono text-blue-900"
                                value={formData.password}
                                onChange={e => setFormData((prev: any) => ({...prev, password: e.target.value}))}
                                required
                            />
                        </div>
                    </div>
                )}
                {isAccountMode && (
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Akun</Label>
                        <Select value={formData.status} onValueChange={(status) => setFormData((prev: any) => ({ ...prev, status }))}>
                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AKTIF">AKTIF</SelectItem>
                                <SelectItem value="NONAKTIF">NONAKTIF</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="pt-4">
                    <Button type="submit" className="w-full h-14 bg-[#000080] hover:bg-blue-900 text-lg font-black rounded-2xl shadow-lg shadow-blue-900/10 transition-all">
                        {isAccountMode ? "Simpan Akun Portal" : editMode ? "Simpan Perubahan" : "Simpan Data Baru"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
