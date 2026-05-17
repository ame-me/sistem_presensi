"use client";

import { Fragment, useState } from "react";
import { useGuruData } from "@/hooks/useGuruData";
import { getApiBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Shield,
    RefreshCw,
    AlertCircle,
    KeyRound,
    UserPlus,
    CheckCircle2,
    Lock,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    User,
    MessageSquare,
    Users,
    Key
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { PasswordResetRequests } from "@/components/password-reset-requests";
import {
    ACCESS_ROLES,
    APP_PAGES,
    LOCKED_ACCESS_ROUTES,
    mergeAccessMatrix,
    type AccessLevel,
    type AccessRole,
} from "@/lib/access-control";

export default function ITUsersPage() {
    const { guru, loading, error, refetch } = useGuruData();
    const API_BASE_URL = getApiBaseUrl();
    const accessMatrix = useAppStore((s) => s.accessMatrix);
    const setPageAccess = useAppStore((s) => s.setPageAccess);
    const resetAccessMatrix = useAppStore((s) => s.resetAccessMatrix);
    const [searchTerm, setSearchTerm] = useState("");
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'access' | 'reset-requests'>('users');

    const filteredUsers = guru.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.teacherCode && u.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openResetDialog = (user: any) => {
        setSelectedUser(user);
        setResetDialogOpen(true);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        
        setIsResetting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/guru/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedUser.id,
                    action: 'reset_password'
                })
            });
            
            const data = await response.json();
            
            if (data.status === "success") {
                toast.success(`Password untuk ${selectedUser.name} berhasil direset ke: password123`, {
                    duration: 5000,
                    icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
                });
            } else {
                toast.error(data.message || "Gagal mereset password");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setIsResetting(false);
            setResetDialogOpen(false);
        }
    };

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        teacherCode: "",
        email: "",
        role: "GURU MAPEL"
    });

    const openEditDialog = (user: any) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            teacherCode: user.teacherCode || "",
            email: user.email || "",
            role: user.role
        });
        setEditDialogOpen(true);
    };

    const handleSaveUser = async (isNew: boolean) => {
        if (!formData.name || !formData.teacherCode || !formData.email) {
            toast.error("Semua field wajib diisi");
            return;
        }

        setIsSaving(true);
        try {
            const method = isNew ? 'POST' : 'PUT';
            const body: any = { ...formData };
            if (!isNew) body.id = selectedUser.id;

            const response = await fetch(`${API_BASE_URL}/guru/index.php`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.status === "success") {
                toast.success(isNew ? "User baru berhasil ditambahkan" : "Data user berhasil diperbarui");
                setAddDialogOpen(false);
                setEditDialogOpen(false);
            } else {
                toast.error(data.message || "Gagal menyimpan data");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setIsSaving(false);
        }
    };

    // Re-wrap handleSaveUser to use refetch
    const onSave = async (isNew: boolean) => {
        await handleSaveUser(isNew);
        refetch();
    };

    const effectiveAccessMatrix = mergeAccessMatrix(accessMatrix);
    const pageSections = APP_PAGES.reduce<Record<string, typeof APP_PAGES>>((acc, page) => {
        if (!acc[page.section]) acc[page.section] = [];
        acc[page.section].push(page);
        return acc;
    }, {});

    const handleChangePageAccess = async (role: AccessRole, path: string, level: AccessLevel) => {
        if (role === "ADMIN_IT" && LOCKED_ACCESS_ROUTES.has(path)) return;
        try {
            await setPageAccess(role, path, level);
            toast.success("Matriks akses tersimpan.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan matriks akses");
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Manajemen Akses & User</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Kelola akun guru, administrator, dan hak akses sistem.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ name: "", teacherCode: "", email: "", role: "GURU MAPEL" });
                        setAddDialogOpen(true);
                    }}
                    className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-900/10"
                >
                    <UserPlus className="w-5 h-5 mr-2" /> Tambah User Baru
                </Button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm ${activeTab === 'users' ? 'text-[#000080] border-b-2 border-[#000080]' : 'text-slate-600 hover:text-slate-800'}`}
                >
                    <Users className="w-4 h-4" />
                    Daftar User
                </button>
                <button
                    onClick={() => setActiveTab('access')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm ${activeTab === 'access' ? 'text-[#000080] border-b-2 border-[#000080]' : 'text-slate-600 hover:text-slate-800'}`}
                >
                    <Shield className="w-4 h-4" />
                    Matriks Akses
                </button>
                <button
                    onClick={() => setActiveTab('reset-requests')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm ${activeTab === 'reset-requests' ? 'text-[#000080] border-b-2 border-[#000080]' : 'text-slate-600 hover:text-slate-800'}`}
                >
                    <Key className="w-4 h-4" />
                    Reset Password
                    <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">Admin</Badge>
                </button>
            </div>

            {activeTab === 'users' && (
                <>
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Daftar Akun Terdaftar
                                </CardTitle>
                                <CardDescription>Seluruh akun yang aktif di dalam sistem presensi.</CardDescription>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Input
                                    placeholder="Cari Nama/Email/Role..."
                                    className="bg-white pl-4 h-11 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                        <tr>
                                            <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Informasi User</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Kontak / Email</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Peran (Role)</th>
                                            <th className="px-6 py-4 text-right whitespace-nowrap text-[10px] tracking-wider">Kontrol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                                                    Menyinkronkan data user...
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-red-500 font-medium font-sans">
                                                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length > 0 ? (
                                            filteredUsers.map((u, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <p className="font-bold text-slate-700 whitespace-nowrap">{u.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{u.teacherCode ? `KODE: ${u.teacherCode}` : 'ID: ' + u.id}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                        {u.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-wrap gap-1">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    "font-bold uppercase text-[9px] tracking-widest px-2 py-1 rounded-lg",
                                                                    u.role.toLowerCase().includes('admin') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-slate-100 text-slate-700'
                                                                )}
                                                            >
                                                                {u.role.replace('_', ' ')}
                                                            </Badge>
                                                            {u.wali_kelas && u.wali_kelas !== "-" && (
                                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold uppercase text-[9px] tracking-widest px-2 py-1 rounded-lg">
                                                                    Wali Kelas {u.wali_kelas.split(' (')[0]}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                                        <Button
                                                            onClick={() => openEditDialog(u)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-9 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => openResetDialog(u)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-9 px-4 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl group/btn transition-all"
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5 mr-2 group-hover/btn:rotate-12 transition-transform" />
                                                            Reset Password
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                    Pencarian "{searchTerm}" tidak ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add User Dialog */}
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-[#000080]">Tambah User Baru</DialogTitle>
                                <DialogDescription>
                                    Daftarkan guru baru ke sistem dengan akses login.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Masukkan nama lengkap..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kode Guru (ID)</Label>
                                    <Input
                                        value={formData.teacherCode}
                                        onChange={e => setFormData({...formData, teacherCode: e.target.value})}
                                        placeholder="Contoh: 101"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Sekolah</Label>
                                    <Input
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="guru@sekolah.id"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Peran / Role Access</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                                            <SelectItem value="Wali Kelas">Wali Kelas</SelectItem>
                                            <SelectItem value="Guru BK">Guru BK / Konseling</SelectItem>
                                            <SelectItem value="ADMIN_IT">Administrator IT</SelectItem>
                                            <SelectItem value="ADMIN_TU">Admin TU</SelectItem>
                                            <SelectItem value="ADMIN">Kepala Sekolah</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSaving}>Batal</Button>
                                <Button onClick={() => onSave(true)} disabled={isSaving} className="bg-[#000080]">
                                    {isSaving ? "Menyimpan..." : "Simpan User"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit User Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-[#000080]">Edit Akses User</DialogTitle>
                                <DialogDescription>
                                    Perbarui informasi kontak dan peran untuk {selectedUser?.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Email Sekolah</Label>
                                    <Input
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Peran / Role Access</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                                            <SelectItem value="Wali Kelas">Wali Kelas</SelectItem>
                                            <SelectItem value="Guru BK">Guru BK / Konseling</SelectItem>
                                            <SelectItem value="ADMIN_IT">Administrator IT</SelectItem>
                                            <SelectItem value="ADMIN_TU">Admin TU</SelectItem>
                                            <SelectItem value="ADMIN">Kepala Sekolah</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Batal</Button>
                                <Button onClick={() => onSave(false)} disabled={isSaving} className="bg-[#000080]">
                                    {isSaving ? "Menyimpan..." : "Perbarui User"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Reset Password Dialog */}
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-[#000080] flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Konfirmasi Reset Password
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Apakah Anda yakin ingin mereset password untuk user <span className="font-bold text-slate-900">{selectedUser?.name}</span>?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 mt-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    Setelah direset, password user akan dikembalikan ke pengaturan default: <span className="font-bold">password123</span>. User disarankan segera mengganti password setelah berhasil login.
                                </p>
                            </div>
                            <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="rounded-xl font-bold h-11 flex-1 sm:flex-none">
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleResetPassword}
                                    disabled={isResetting}
                                    className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-11 rounded-xl flex-1 sm:flex-none"
                                >
                                    {isResetting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Mereset...
                                        </>
                                    ) : (
                                        "Ya, Reset Password"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {activeTab === 'access' && (
                <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Matriks Akses Sidebar
                            </CardTitle>
                            <CardDescription>
                                Atur level akses halaman yang muncul di sidebar: none, view only, atau full CRUD.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                try {
                                    await resetAccessMatrix();
                                    toast.success("Matriks akses dikembalikan ke default.");
                                } catch (error) {
                                    toast.error(error instanceof Error ? error.message : "Gagal reset matriks akses");
                                }
                            }}
                            className="font-bold rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Default
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4 text-left whitespace-nowrap text-[10px] tracking-wider min-w-[260px]">Halaman</th>
                                        {ACCESS_ROLES.map((role) => (
                                            <th key={role.key} className="px-4 py-4 text-center whitespace-nowrap text-[10px] tracking-wider">
                                                {role.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(pageSections).map(([section, pages]) => (
                                        <Fragment key={section}>
                                            <tr className="bg-slate-50/60">
                                                <td colSpan={ACCESS_ROLES.length + 1} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#000080]">
                                                    {section}
                                                </td>
                                            </tr>
                                            {pages.map((page) => (
                                                <tr key={page.path} className="hover:bg-slate-50/40">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-700">{page.label}</p>
                                                        <p className="text-[10px] font-mono text-slate-400">{page.path}</p>
                                                    </td>
                                                    {ACCESS_ROLES.map((role) => {
                                                        const locked = role.key === "ADMIN_IT" && LOCKED_ACCESS_ROUTES.has(page.path);
                                                        const level = locked ? "full" : (effectiveAccessMatrix[role.key]?.[page.path] || "none");

                                                        return (
                                                            <td key={`${role.key}-${page.path}`} className="px-4 py-4">
                                                                <Select
                                                                    value={level}
                                                                    disabled={locked}
                                                                    onValueChange={(value) => handleChangePageAccess(role.key, page.path, value as AccessLevel)}
                                                                >
                                                                    <SelectTrigger className="h-9 min-w-[108px] rounded-xl bg-white text-xs font-bold">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">None</SelectItem>
                                                                        <SelectItem value="view">View Only</SelectItem>
                                                                        <SelectItem value="full">Full</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'reset-requests' && (
                <PasswordResetRequests />
            )}

            <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Daftar Akun Terdaftar
                        </CardTitle>
                        <CardDescription>Seluruh akun yang aktif di dalam sistem presensi.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Input
                            placeholder="Cari Nama/Email/Role..."
                            className="bg-white pl-4 h-11 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Informasi User</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Kontak / Email</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-[10px] tracking-wider">Peran (Role)</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap text-[10px] tracking-wider">Kontrol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                                            Menyinkronkan data user...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-red-500 font-medium font-sans">
                                            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((u, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-slate-700 whitespace-nowrap">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{u.teacherCode ? `KODE: ${u.teacherCode}` : 'ID: ' + u.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "font-bold uppercase text-[9px] tracking-widest px-2 py-1 rounded-lg",
                                                            u.role.toLowerCase().includes('admin') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-slate-100 text-slate-700'
                                                        )}
                                                    >
                                                        {u.role.replace('_', ' ')}
                                                    </Badge>
                                                    {u.wali_kelas && u.wali_kelas !== "-" && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold uppercase text-[9px] tracking-widest px-2 py-1 rounded-lg">
                                                            Wali Kelas {u.wali_kelas.split(' (')[0]}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                                <Button 
                                                    onClick={() => openEditDialog(u)}
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-9 px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    Edit
                                                </Button>
                                                <Button 
                                                    onClick={() => openResetDialog(u)}
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-9 px-4 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl group/btn transition-all"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5 mr-2 group-hover/btn:rotate-12 transition-transform" /> 
                                                    Reset Password
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                            Pencarian "{searchTerm}" tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#000080]">Tambah User Baru</DialogTitle>
                        <DialogDescription>
                            Daftarkan guru baru ke sistem dengan akses login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama Lengkap</Label>
                            <Input 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                placeholder="Masukkan nama lengkap..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kode Guru (ID)</Label>
                            <Input 
                                value={formData.teacherCode} 
                                onChange={e => setFormData({...formData, teacherCode: e.target.value})} 
                                placeholder="Contoh: 101"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Sekolah</Label>
                            <Input 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                placeholder="guru@sekolah.id"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Peran / Role Access</Label>
                            <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                                    <SelectItem value="Wali Kelas">Wali Kelas</SelectItem>
                                    <SelectItem value="Guru BK">Guru BK / Konseling</SelectItem>
                                    <SelectItem value="ADMIN_IT">Administrator IT</SelectItem>
                                    <SelectItem value="ADMIN_TU">Admin TU</SelectItem>
                                    <SelectItem value="ADMIN">Kepala Sekolah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSaving}>Batal</Button>
                        <Button onClick={() => onSave(true)} disabled={isSaving} className="bg-[#000080]">
                            {isSaving ? "Menyimpan..." : "Simpan User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#000080]">Edit Akses User</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi kontak dan peran untuk {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Email Sekolah</Label>
                            <Input 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Peran / Role Access</Label>
                            <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Guru Mapel">Guru Mapel</SelectItem>
                                    <SelectItem value="Wali Kelas">Wali Kelas</SelectItem>
                                    <SelectItem value="Guru BK">Guru BK / Konseling</SelectItem>
                                    <SelectItem value="ADMIN_IT">Administrator IT</SelectItem>
                                    <SelectItem value="ADMIN_TU">Admin TU</SelectItem>
                                    <SelectItem value="ADMIN">Kepala Sekolah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Batal</Button>
                        <Button onClick={() => onSave(false)} disabled={isSaving} className="bg-[#000080]">
                            {isSaving ? "Menyimpan..." : "Perbarui User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#000080] flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Konfirmasi Reset Password
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Apakah Anda yakin ingin mereset password untuk user <span className="font-bold text-slate-900">{selectedUser?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 mt-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Setelah direset, password user akan dikembalikan ke pengaturan default: <span className="font-bold">password123</span>. User disarankan segera mengganti password setelah berhasil login.
                        </p>
                    </div>
                    <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="rounded-xl font-bold h-11 flex-1 sm:flex-none">
                            Batal
                        </Button>
                        <Button 
                            onClick={handleResetPassword}
                            disabled={isResetting}
                            className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-11 rounded-xl flex-1 sm:flex-none"
                        >
                            {isResetting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Mereset...
                                </>
                            ) : (
                                "Ya, Reset Password"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
