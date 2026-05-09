"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    Mail
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Ortu {
    id: number;
    nik: string;
    name: string;
    email: string;
    phone: string;
    status: string;
}

export default function ITOrangTuaPage() {
    const [ortuList, setOrtuList] = useState<Ortu[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        nik: "",
        name: "",
        email: "",
        phone: "",
        password: "password123",
        status: "AKTIF"
    });

    const fetchOrtu = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1/presensipander/api/ortu/index.php');
            const data = await res.json();
            if (data.status === 'success') {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editMode ? "PUT" : "POST";
        const url = editMode 
            ? `http://127.0.0.1/presensipander/api/ortu/index.php?id=${selectedId}`
            : 'http://127.0.0.1/presensipander/api/ortu/index.php';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success(data.message);
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
            const res = await fetch(`http://127.0.0.1/presensipander/api/ortu/index.php?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success("Berhasil dihapus");
                fetchOrtu();
            }
        } catch (error) {
            toast.error("Gagal menghapus data");
        }
    };

    const resetForm = () => {
        setFormData({ nik: "", name: "", email: "", phone: "", password: "password123", status: "AKTIF" });
        setEditMode(false);
        setSelectedId(null);
    };

    const handleEdit = (ortu: Ortu) => {
        setFormData({
            nik: ortu.nik,
            name: ortu.name,
            email: ortu.email || "",
            phone: ortu.phone || "",
            password: "", // Jangan tampilkan password lama
            status: ortu.status
        });
        setSelectedId(ortu.id);
        setEditMode(true);
        setIsDialogOpen(true);
    };

    const filtered = ortuList.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase()) || 
        o.nik.includes(search)
    );

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#000080] tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        Manajemen Akun Orang Tua
                    </h1>
                    <p className="text-slate-500 font-medium">Pengaturan kredensial login (NIK) untuk akses Portal Orang Tua</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#000080] hover:bg-blue-900 font-bold h-12 shadow-md rounded-xl">
                            <Plus className="w-5 h-5 mr-2" />
                            Tambah Akun Ortu
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden">
                        <DialogHeader className="bg-blue-50 px-8 py-6">
                            <DialogTitle className="text-2xl font-black text-[#000080]">
                                {editMode ? "Edit Akun Orang Tua" : "Registrasi Akun Orang Tua"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">NIK (Sebagai Username)</Label>
                                <Input 
                                    className="h-11 bg-slate-50 border-slate-200" 
                                    placeholder="Contoh: 1234567890..." 
                                    value={formData.nik}
                                    onChange={e => setFormData({...formData, nik: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap</Label>
                                <Input 
                                    className="h-11 bg-slate-50 border-slate-200" 
                                    placeholder="Nama Orang Tua / Wali" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</Label>
                                    <Input 
                                        type="email"
                                        className="h-11 bg-slate-50 border-slate-200" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">No. WhatsApp</Label>
                                    <Input 
                                        className="h-11 bg-slate-50 border-slate-200" 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            {!editMode && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-blue-600">Password Awal</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <Input 
                                            className="h-11 bg-blue-50 border-blue-100 pl-10 font-mono text-blue-900" 
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            required 
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="pt-4">
                                <Button type="submit" className="w-full h-14 bg-[#000080] hover:bg-blue-900 text-lg font-black rounded-2xl shadow-lg shadow-blue-900/10 transition-all">
                                    {editMode ? "Simpan Perubahan" : "Simpan Akun Baru"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input 
                            className="bg-white pl-10 h-11 border-slate-200 focus:ring-blue-500/20 rounded-xl" 
                            placeholder="Cari berdasarkan Nama atau NIK..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
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
                                        <th className="px-8 py-4">Data Identitas</th>
                                        <th className="px-6 py-4">Kontak</th>
                                        <th className="px-6 py-4">Status Akun</th>
                                        <th className="px-8 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map((ortu) => (
                                        <tr key={ortu.id} className="hover:bg-slate-50 transition-colors group">
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
                                                    <div className={`w-2 h-2 rounded-full ${ortu.status === 'AKTIF' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-red-500'}`} />
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{ortu.status}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                                                        onClick={() => handleEdit(ortu)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                                                        onClick={() => handleDelete(ortu.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
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
