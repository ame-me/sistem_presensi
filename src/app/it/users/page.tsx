"use client";

import { useState } from "react";
import { useGuruData } from "@/hooks/useGuruData";
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
    Lock
} from "lucide-react";
import { toast } from "sonner";

export default function ITUsersPage() {
    const { guru, loading, error } = useGuruData();
    const [searchTerm, setSearchTerm] = useState("");
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isResetting, setIsResetting] = useState(false);

    const filteredUsers = guru.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.teacherCode && u.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openResetDialog = (user: any) => {
        setSelectedUser(user);
        setResetDialogOpen(true);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        
        setIsResetting(true);
        // Simulasi hit API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsResetting(false);
        setResetDialogOpen(false);
        toast.success(`Password untuk ${selectedUser.name} berhasil direset ke: password123`, {
            duration: 5000,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
        });
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
                <Button className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-900/10">
                    <UserPlus className="w-5 h-5 mr-2" /> Tambah User Baru
                </Button>
            </div>

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
                                                <p className="font-bold text-slate-700 whitespace-nowrap">{u.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{u.teacherCode ? `KODE: ${u.teacherCode}` : 'ID: ' + u.id}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={u.role.includes('ADMIN') ? 'default' : 'outline'}
                                                    className={cn(
                                                        "font-bold uppercase text-[9px] tracking-widest px-2.5 py-1 rounded-lg",
                                                        u.role.includes('ADMIN') ? 'bg-[#000080]' : 'text-slate-500 border-slate-200 bg-slate-50'
                                                    )}
                                                >
                                                    {u.role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
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
