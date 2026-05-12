"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { AccessGuard } from "@/components/access-guard";
import { canAccessPage, getDefaultAccessiblePath, resolveAccessRole } from "@/lib/access-control";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, BookOpen, Presentation, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function SelectRolePage() {
    const router = useRouter();
    const { currentUser, logout, accessMatrix, accessMatrixLoaded } = useAppStore();
    const [isWaliKelas, setIsWaliKelas] = useState(false);

    useEffect(() => {
        if (!accessMatrixLoaded) return;

        if (!currentUser) {
            router.replace("/login");
            return;
        }

        if (!canAccessPage(currentUser, "/select-role", accessMatrix)) {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
            return;
        }

        const role = resolveAccessRole(currentUser.role);

        // Check if teacher is Wali Kelas
        if (role === "GURU") {
            if (currentUser.waliKelasRombelName && currentUser.waliKelasRombelName !== "-") {
                setIsWaliKelas(true);
            } else {
                router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
            }
        } else if (role === "ADMIN_IT") {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
        } else if (role === "ADMIN" || role === "ADMIN_TU") {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
        } else if (role === "ORTU") {
            router.replace(getDefaultAccessiblePath(currentUser, accessMatrix));
        }
    }, [currentUser, accessMatrix, accessMatrixLoaded, router]);

    const handleRoleSelect = (role: 'GURU' | 'WALI_KELAS') => {
        if (role === 'WALI_KELAS') {
            router.push(canAccessPage(currentUser, "/guru/wali-kelas", accessMatrix) ? "/guru/wali-kelas" : getDefaultAccessiblePath(currentUser, accessMatrix));
        } else {
            router.push(canAccessPage(currentUser, "/guru/dashboard", accessMatrix) ? "/guru/dashboard" : getDefaultAccessiblePath(currentUser, accessMatrix));
        }
    };

    if (!accessMatrixLoaded || !currentUser || !isWaliKelas) return null;

    return (
        <AccessGuard>
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-2xl rounded-3xl overflow-hidden border-none ring-1 ring-slate-100">
                <CardHeader className="text-center pt-10 pb-6">
                    <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                        <UserCheck className="w-10 h-10 text-indigo-600" />
                    </div>
                    <CardTitle className="text-3xl font-black text-[#000080]">Pilih Peran Anda</CardTitle>
                    <CardDescription className="text-slate-500 font-bold mt-2">
                        Anda terdeteksi sebagai pengajar sekaligus Wali Kelas <b>{currentUser.waliKelasRombelName}</b>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Option 1: Guru Mapel */}
                        <button 
                            onClick={() => handleRoleSelect('GURU')}
                            className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 text-center"
                        >
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Presentation className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">Guru Mata Pelajaran</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">
                                Presensi siswa di kelas saat jam pelajaran Anda berlangsung.
                            </p>
                            <div className="mt-6 px-6 py-2 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 rounded-xl text-xs font-black transition-colors">
                                Masuk Panel
                            </div>
                        </button>

                        {/* Option 2: Wali Kelas */}
                        <button 
                            onClick={() => handleRoleSelect('WALI_KELAS')}
                            className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-100 rounded-3xl hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">Wali Kelas {currentUser.waliKelasRombelName}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">
                                Monitoring laporan presensi dan aktivitas siswa di kelas Anda.
                            </p>
                            <div className="mt-6 px-6 py-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 rounded-xl text-xs font-black transition-colors">
                                Lihat Laporan
                            </div>
                        </button>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Button 
                            variant="ghost" 
                            className="text-slate-400 hover:text-red-600 font-bold text-xs"
                            onClick={() => {
                                logout();
                                router.replace("/login");
                            }}
                        >
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                            Keluar dari Sesi
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
        </AccessGuard>
    );
}
