"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, ShieldAlert, Cpu, Activity, Clock, Users, GraduationCap, School } from "lucide-react";
import { useGuruData } from "@/hooks/useGuruData";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useKelasData } from "@/hooks/useKelasData";
import { useState, useEffect } from "react";

export default function AdminITDashboard() {
    const currentUser = useAppStore((s) => s.currentUser);
    
    const { guru } = useGuruData();
    const { siswa } = useSiswaData();
    const { kelas } = useKelasData();
    const [ortuCount, setOrtuCount] = useState(0);

    useEffect(() => {
        const fetchOrtu = async () => {
            try {
                const res = await fetch('http://127.0.0.1/presensipander/api/ortu/index.php');
                const data = await res.json();
                if (data.status === 'success') {
                    setOrtuCount(data.data.length);
                }
            } catch (error) {
                console.error("Failed to fetch ortu count", error);
            }
        };
        fetchOrtu();
    }, []);

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">IT Dashboard</h1>
                <p className="text-blue-700 font-medium flex items-center gap-2 mt-1">
                    Selamat datang, {currentUser?.name || "Admin IT"}.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            Database Objects
                        </CardTitle>
                        <div className="w-10 h-10 bg-blue-100 text-[#000080] rounded-full flex items-center justify-center -mt-2 -mr-2 shadow-sm">
                            <Database className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-3xl font-extrabold text-slate-800">{guru.length + siswa.length + kelas.length} Items</div>
                        <p className="text-sm font-medium text-blue-600 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Synchronized with MySQL
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            Master Guru
                        </CardTitle>
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center -mt-2 -mr-2 shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-3xl font-extrabold text-slate-800">{guru.length} Guru</div>
                        <p className="text-sm font-medium text-slate-500 mt-2">Akun terdaftar aktif</p>
                    </CardContent>
                </Card>
                
                <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            Master Siswa
                        </CardTitle>
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center -mt-2 -mr-2 shadow-sm">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-3xl font-extrabold text-slate-800">{siswa.length} Siswa</div>
                        <p className="text-sm font-medium text-slate-500 mt-2">Total di database pander</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            Registered Ortu
                        </CardTitle>
                        <div className="w-10 h-10 bg-blue-100 text-[#000080] rounded-full flex items-center justify-center -mt-2 -mr-2 shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-3xl font-extrabold text-slate-800">{ortuCount} Accounts</div>
                        <p className="text-sm font-medium text-blue-600 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Live from database
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-slate-800 text-lg font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Recent System Logs
                    </CardTitle>
                    <CardDescription>Log aktivitas critical di server SIPANDU</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Event</th>
                                <th className="px-6 py-3">User/Source</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-slate-500 font-mono text-xs">2026-03-12 11:45:00</td>
                                <td className="px-6 py-3 font-medium text-slate-700">Database Backup Auto</td>
                                <td className="px-6 py-3">CRON</td>
                                <td className="px-6 py-3"><span className="text-blue-600 font-bold">SUCCESS</span></td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-slate-500 font-mono text-xs">2026-03-12 10:15:22</td>
                                <td className="px-6 py-3 font-medium text-slate-700">WA Gateway Handshake</td>
                                <td className="px-6 py-3">API Server</td>
                                <td className="px-6 py-3"><span className="text-blue-600 font-bold">SUCCESS</span></td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-slate-500 font-mono text-xs">2026-03-12 08:30:11</td>
                                <td className="px-6 py-3 font-medium text-slate-700">Login Attempt Failed (Password)</td>
                                <td className="px-6 py-3">guru1@sekolah.id</td>
                                <td className="px-6 py-3"><span className="text-amber-600 font-bold">WARNING</span></td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

        </div>
    );
}
