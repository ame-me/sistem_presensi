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
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    MessageSquare,
    Shield,
    Database,
    Save,
    RefreshCw,
    Smartphone,
    Link,
    Unlink,
    AlertCircle,
    KeyRound,
    Trash2,
    Download
} from "lucide-react";

export default function AdminITSettingsPage() {
    const [activeTab, setActiveTab] = useState("access");
    const { guru, loading, error } = useGuruData();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = guru.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.teacherCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Pengaturan System & IT</h1>
                <p className="text-slate-500 font-medium mt-1">
                    Konfigurasi infrastruktur, keamanan, dan database aplikasi SIPANDU.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="access" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 transition-all">
                        <Shield className="w-4 h-4 mr-2" />
                        Akses & User
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="data-[state=active]:bg-[#000080] data-[state=active]:text-white rounded-lg px-4 font-bold h-10 transition-all">
                        <Database className="w-4 h-4 mr-2" />
                        Backup & Data
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="access" className="space-y-6 animate-in slide-in-from-bottom-2">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden max-w-5xl">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle className="text-[#000080] text-lg font-bold">Manajemen User System</CardTitle>
                                <CardDescription>Daftar seluruh akun guru dan administrator yang terdaftar di database.</CardDescription>
                            </div>
                            <Input
                                placeholder="Cari Nama/Email/Role..."
                                className="w-full md:w-64 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3 text-sm text-amber-800">
                                <AlertCircle className="w-4 h-4" />
                                <span>Fitur Reset Password akan segera tersedia untuk sinkronisasi database.</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                                        <tr>
                                            <th className="px-6 py-3 whitespace-nowrap text-[10px] tracking-wider">Nama User</th>
                                            <th className="px-6 py-3 whitespace-nowrap text-[10px] tracking-wider">Email</th>
                                            <th className="px-6 py-3 whitespace-nowrap text-[10px] tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-right whitespace-nowrap text-[10px] tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                                                    Menyinkronkan data dengan database...
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
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-700 whitespace-nowrap">{u.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">{u.teacherCode && `CODE: ${u.teacherCode}`}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                        {u.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge
                                                            variant={u.role.includes('ADMIN') ? 'default' : 'outline'}
                                                            className={cn(
                                                                "font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-md",
                                                                u.role.includes('ADMIN') ? 'bg-[#000080]' : 'text-slate-500 border-slate-200 bg-slate-50'
                                                            )}
                                                        >
                                                            {u.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <Button size="sm" variant="ghost" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg group">
                                                            <KeyRound className="w-3.5 h-3.5 mr-1 group-hover:rotate-12 transition-transform" /> Reset
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                    Tidak ada user yang cocok dengan pencarian.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="backup" className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-blue-900 text-base font-bold flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Ekspor Database Server
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Unduh salinan lengkap database SQL (semua tabel) untuk keperluan migrasi atau arsip rutin.
                                </p>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11">
                                    <Database className="w-4 h-4 mr-2" /> Download Backup (.sql)
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                            <CardHeader className="bg-red-50 border-b border-red-100">
                                <CardTitle className="text-red-900 text-base font-bold flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    System Maintenance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Hapus file cache sementara, log notifikasi error, dan reset session token yang usang.
                                </p>
                                <Button variant="destructive" className="w-full font-bold h-11">
                                    <RefreshCw className="w-4 h-4 mr-2" /> Bersihkan Cache & Log Lama
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
