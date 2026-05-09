"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Database,
    RefreshCw,
    Trash2,
    Download,
    History,
    CheckCircle2,
    Server,
    HardDrive,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export default function ITBackupPage() {
    const [isCleaning, setIsCleaning] = useState(false);
    const [lastBackup, setLastBackup] = useState("Kemarin, 23:10");

    const handleBackup = () => {
        window.open('http://127.0.0.1/presensipander/api/system/backup.php', '_blank');
        setLastBackup("Baru saja");
        toast.success("Database berhasil diekspor. File .sql sedang diunduh.");
    };

    const handleClean = async () => {
        setIsCleaning(true);
        try {
            const res = await fetch('http://127.0.0.1/presensipander/api/system/clean.php');
            const data = await res.json();
            if (data.status === 'success') {
                toast.success(data.message);
            }
        } catch (error) {
            toast.error("Gagal melakukan pembersihan sistem");
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header Area */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Backup & Pemeliharaan Data</h1>
                <p className="text-slate-500 font-medium mt-1">
                    Amankan data sekolah dengan pencadangan rutin dan pembersihan system.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Pencadangan Database (.sql)
                        </CardTitle>
                        <CardDescription>Ekspor seluruh tabel database untuk keperluan arsip atau migrasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Server className="w-10 h-10" />
                        </div>
                        <div className="max-w-md">
                            <h3 className="text-lg font-bold text-slate-800">Database Siap Dicadangkan</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                System akan melakukan ekspor data secara komprehensif termasuk data presensi, jurnal, user, dan pengaturan jadwal.
                            </p>
                        </div>
                        <Button 
                            className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-900/10"
                            onClick={handleBackup}
                        >
                            <Download className="w-4 h-4 mr-2" /> Mulai Download Backup Sekarang
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-red-50 border-b border-red-100">
                            <CardTitle className="text-red-900 text-base font-bold flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                System Cleaning
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Bersihkan file cache sementara dan log lama untuk menjaga performa server.
                            </p>
                            <Button 
                                variant="destructive" 
                                className="w-full font-bold h-11 rounded-xl"
                                onClick={handleClean}
                                disabled={isCleaning}
                            >
                                {isCleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                {isCleaning ? "Membersihkan..." : "Bersihkan Cache"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-500" />
                                Status Backup
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Terakhir Backup:</span>
                                    <span className="font-bold text-slate-700">{lastBackup}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Ukuran Data:</span>
                                    <span className="font-bold text-slate-700">12.4 MB</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                        <CheckCircle2 className="w-3 h-3" /> System Health: Excellent
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
